import { doc, getDoc, updateDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { CartItem } from "@/lib/cart-context"

type OrderAddress = {
  fullName?: string
  phone?: string
  address?: string
  landmark?: string
  city?: string
  state?: string
  pincode?: string
}

type PaddlerOrder = {
  id: string
  invoiceNumber?: string
  items?: CartItem[]
  customer?: {
    name?: string
    email?: string
    phone?: string
  }
  address?: OrderAddress
  pricing?: {
    subtotal?: number
    shipping?: number
    couponDiscount?: number
    total?: number
  }
  payment?: {
    status?: string
  }
  shipment?: {
    provider?: string
    status?: string
    shiprocketOrderId?: number | string
    shipmentId?: number | string
    awb?: string
    courierName?: string
    trackingUrl?: string
  }
  createdAt?: string
}

type ShiprocketConfig = {
  apiBaseUrl: string
  email: string
  password: string
  pickupLocation: string
  defaultWeightKg: number
  defaultLengthCm: number
  defaultBreadthCm: number
  defaultHeightCm: number
  defaultCourierId?: number
  pickupPostcode: string
}

type ShiprocketTokenCache = {
  token: string
  expiresAt: number
}

let tokenCache: ShiprocketTokenCache | null = null

const fetchWithTimeout = async (
  input: string,
  init: RequestInit = {},
  timeoutMs = 12000
) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

const getShiprocketConfig = (): ShiprocketConfig => {
  const email = process.env.SHIPROCKET_EMAIL
  const password = process.env.SHIPROCKET_PASSWORD

  if (!email || !password) {
    throw new Error("Shiprocket email/password is missing in .env.local.")
  }

  return {
    apiBaseUrl:
      process.env.SHIPROCKET_API_BASE_URL || "https://apiv2.shiprocket.in/v1/external",
    email,
    password,
    pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
    defaultWeightKg: Number(process.env.SHIPROCKET_DEFAULT_WEIGHT_KG || 0.5),
    defaultLengthCm: Number(process.env.SHIPROCKET_DEFAULT_LENGTH_CM || 28),
    defaultBreadthCm: Number(process.env.SHIPROCKET_DEFAULT_BREADTH_CM || 22),
    defaultHeightCm: Number(process.env.SHIPROCKET_DEFAULT_HEIGHT_CM || 4),
    defaultCourierId: process.env.SHIPROCKET_DEFAULT_COURIER_ID
      ? Number(process.env.SHIPROCKET_DEFAULT_COURIER_ID)
      : undefined,
    pickupPostcode: process.env.SHIPROCKET_PICKUP_POSTCODE || "462038",
  }
}

const getShiprocketToken = async (forceRefresh = false) => {
  const config = getShiprocketConfig()
  const now = Date.now()

  if (!forceRefresh && tokenCache && tokenCache.expiresAt > now) {
    return tokenCache.token
  }

  const response = await fetchWithTimeout(`${config.apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: config.email,
      password: config.password,
    }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.token) {
    console.error("SHIPROCKET AUTH ERROR:", data)
    throw new Error("Unable to authenticate with Shiprocket.")
  }

  tokenCache = {
    token: data.token,
    expiresAt: now + 9 * 24 * 60 * 60 * 1000,
  }

  return data.token as string
}

const shiprocketFetch = async <T>(
  path: string,
  options: RequestInit = {},
  retrying = false
): Promise<T> => {
  const config = getShiprocketConfig()
  const token = await getShiprocketToken(retrying)
  const response = await fetchWithTimeout(`${config.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })

  const data = await response.json().catch(() => null)

  if (response.status === 401 && !retrying) {
    console.warn("SHIPROCKET TOKEN EXPIRED: refreshing token and retrying.")
    tokenCache = null
    return shiprocketFetch<T>(path, options, true)
  }

  if (!response.ok) {
    console.error("SHIPROCKET API ERROR:", {
      path,
      status: response.status,
      data,
    })
    throw new Error(data?.message || "Shiprocket API request failed.")
  }

  return data as T
}

const formatShiprocketDate = (value?: string) => {
  const date = value ? new Date(value) : new Date()

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`
}

const splitName = (name?: string) => {
  const parts = (name || "Customer").trim().split(/\s+/)
  const firstName = parts.shift() || "Customer"
  const lastName = parts.join(" ") || "."

  return { firstName, lastName }
}

const buildShiprocketOrderPayload = (order: PaddlerOrder) => {
  const config = getShiprocketConfig()
  const address = order.address || {}
  const customerName = order.customer?.name || address.fullName || "Customer"
  const { firstName, lastName } = splitName(customerName)
  const items = order.items?.length ? order.items : []
  const subtotal =
    order.pricing?.subtotal ||
    items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return {
    order_id: order.id,
    order_date: formatShiprocketDate(order.createdAt),
    pickup_location: config.pickupLocation,
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: address.address || "Address not provided",
    billing_address_2: address.landmark || "",
    billing_city: address.city || "City not provided",
    billing_pincode: address.pincode || "000000",
    billing_state: address.state || "State not provided",
    billing_country: "India",
    billing_email: order.customer?.email || "support@thepaddler.in",
    billing_phone: order.customer?.phone || address.phone || "9999999999",
    shipping_is_billing: true,
    order_items: items.map((item) => ({
      name: `${item.name} - ${item.size}`,
      sku: `${item.id}-${item.size}`,
      units: item.quantity,
      selling_price: item.price,
      discount: 0,
      tax: 0,
      hsn: "",
    })),
    payment_method: "Prepaid",
    shipping_charges: Number(order.pricing?.shipping || 0),
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: Number(order.pricing?.couponDiscount || 0),
    sub_total: Number(subtotal),
    length: config.defaultLengthCm,
    breadth: config.defaultBreadthCm,
    height: config.defaultHeightCm,
    weight: config.defaultWeightKg,
  }
}

const buildShiprocketReturnPayload = (order: PaddlerOrder) => {
  const config = getShiprocketConfig()
  const address = order.address || {}
  const customerName = order.customer?.name || address.fullName || "Customer"
  const { firstName, lastName } = splitName(customerName)
  const items = order.items?.length ? order.items : []
  const subtotal =
    order.pricing?.subtotal ||
    items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return {
    order_id: `R-${order.id}`,
    order_date: formatShiprocketDate(new Date().toISOString()).slice(0, 10),
    pickup_customer_name: firstName,
    pickup_last_name: lastName,
    pickup_address: address.address || "Address not provided",
    pickup_address_2: address.landmark || "",
    pickup_city: address.city || "City not provided",
    pickup_state: address.state || "State not provided",
    pickup_country: "India",
    pickup_pincode: Number(address.pincode || 0),
    pickup_email: order.customer?.email || "support@thepaddler.in",
    pickup_phone: order.customer?.phone || address.phone || "9999999999",
    pickup_isd_code: "91",
    shipping_customer_name: process.env.SHIPROCKET_RETURN_NAME || "THE PADDLER",
    shipping_last_name: "",
    shipping_address:
      process.env.SHIPROCKET_RETURN_ADDRESS || config.pickupLocation,
    shipping_address_2: process.env.SHIPROCKET_RETURN_ADDRESS_2 || "",
    shipping_city: process.env.SHIPROCKET_RETURN_CITY || "Bhopal",
    shipping_country: "India",
    shipping_pincode: Number(process.env.SHIPROCKET_RETURN_PINCODE || 462038),
    shipping_state: process.env.SHIPROCKET_RETURN_STATE || "Madhya Pradesh",
    shipping_email: process.env.SHIPROCKET_RETURN_EMAIL || "support@thepaddler.in",
    shipping_isd_code: "91",
    shipping_phone: process.env.SHIPROCKET_RETURN_PHONE || "9399255433",
    order_items: items.map((item) => ({
      name: item.name,
      sku: `${item.id}-${item.size}`,
      units: item.quantity,
      selling_price: item.price,
      discount: 0,
      qc_enable: false,
      return_reason: "Other",
    })),
    payment_method: "PREPAID",
    total_discount: Number(order.pricing?.couponDiscount || 0),
    sub_total: Number(subtotal),
    length: config.defaultLengthCm,
    breadth: config.defaultBreadthCm,
    height: config.defaultHeightCm,
    weight: config.defaultWeightKg,
  }
}

const extractAwb = (data: Record<string, unknown>) => {
  const response = data?.response as Record<string, unknown> | undefined
  const awbAssignStatus =
    response?.data as Record<string, unknown> | Record<string, unknown>[] | undefined
  const nested = Array.isArray(awbAssignStatus) ? awbAssignStatus[0] : awbAssignStatus

  return (
    data.awb_code ||
    data.awb ||
    data.awbCode ||
    nested?.awb_code ||
    nested?.awb ||
    response?.awb_code ||
    ""
  )
}

const extractCourierName = (data: Record<string, unknown>) => {
  const response = data?.response as Record<string, unknown> | undefined
  const nested = response?.data as Record<string, unknown> | undefined

  return (
    data.courier_name ||
    data.courier ||
    nested?.courier_name ||
    response?.courier_name ||
    ""
  )
}

export const createShiprocketShipmentForOrder = async (orderId: string) => {
  const orderRef = doc(db, "orders", orderId)
  const orderSnap = await getDoc(orderRef)

  if (!orderSnap.exists()) {
    throw new Error("Order not found for Shiprocket shipment.")
  }

  const order = {
    id: orderSnap.id,
    ...(orderSnap.data() as Omit<PaddlerOrder, "id">),
  }

  if (order.payment?.status !== "success") {
    throw new Error("Shiprocket order can be created only after successful payment.")
  }

  if (order.shipment?.shipmentId || order.shipment?.shiprocketOrderId) {
    console.info("SHIPROCKET SKIP: shipment already exists.", {
      orderId,
      shipment: order.shipment,
    })
    return order.shipment
  }

  const shipment = await createShiprocketShipment(order)

  await updateDoc(orderRef, {
    shipment,
    trackingId: shipment.awb || shipment.shipmentId,
    trackingUrl: shipment.trackingUrl,
    status: "processing",
    updatedAt: new Date().toISOString(),
  })

  console.info("SHIPROCKET SHIPMENT SAVED:", {
    orderId,
    shipmentId: shipment.shipmentId,
    awb: shipment.awb,
  })

  return shipment
}

export const createShiprocketShipment = async (order: PaddlerOrder) => {
  const orderId = order.id
  const orderPayload = buildShiprocketOrderPayload(order)
  console.info("SHIPROCKET CREATE ORDER START:", { orderId })

  const createdOrder = await shiprocketFetch<Record<string, unknown>>(
    "/orders/create/adhoc",
    {
      method: "POST",
      body: JSON.stringify(orderPayload),
    }
  )

  const shiprocketOrderId =
    createdOrder.order_id ||
    (createdOrder.data as Record<string, unknown> | undefined)?.order_id
  const shipmentId =
    createdOrder.shipment_id ||
    (createdOrder.data as Record<string, unknown> | undefined)?.shipment_id

  if (!shipmentId) {
    console.error("SHIPROCKET SHIPMENT ID MISSING:", createdOrder)
    throw new Error("Shiprocket did not return shipment id.")
  }

  const config = getShiprocketConfig()
  const awbPayload: Record<string, unknown> = {
    shipment_id: shipmentId,
  }

  if (config.defaultCourierId) {
    awbPayload.courier_id = config.defaultCourierId
  }

  console.info("SHIPROCKET ASSIGN AWB START:", { orderId, shipmentId })

  const awbData = await shiprocketFetch<Record<string, unknown>>(
    "/courier/assign/awb",
    {
      method: "POST",
      body: JSON.stringify(awbPayload),
    }
  )

  const awb = String(extractAwb(awbData) || "")
  const courierName = String(extractCourierName(awbData) || "")
  const trackingUrl = awb ? `/tracking/${orderId}` : ""

  const shipment = {
    provider: "shiprocket",
    status: awb ? "awb_assigned" : "awb_processing",
    shiprocketOrderId: shiprocketOrderId || null,
    shipmentId,
    awb,
    courierName,
    trackingUrl,
    createdOrder,
    awbResponse: awbData,
    updatedAt: new Date().toISOString(),
  }

  console.info("SHIPROCKET SHIPMENT CREATED:", {
    orderId,
    shipmentId,
    awb,
  })

  return shipment
}

export const trackShiprocketAwb = async (awb: string) => {
  if (!awb) {
    throw new Error("AWB is required for tracking.")
  }

  return shiprocketFetch<Record<string, unknown>>(
    `/courier/track/awb/${encodeURIComponent(awb)}`,
    {
      method: "GET",
    }
  )
}

export const checkShiprocketServiceability = async (deliveryPostcode: string) => {
  const config = getShiprocketConfig()
  const params = new URLSearchParams({
    pickup_postcode: config.pickupPostcode,
    delivery_postcode: deliveryPostcode,
    cod: "0",
    weight: String(config.defaultWeightKg),
  })

  return shiprocketFetch<Record<string, unknown>>(
    `/courier/serviceability?${params.toString()}`,
    {
      method: "GET",
    }
  )
}

export const createShiprocketReturnForOrder = async (orderId: string) => {
  const orderRef = doc(db, "orders", orderId)
  const orderSnap = await getDoc(orderRef)

  if (!orderSnap.exists()) {
    throw new Error("Order not found for Shiprocket return.")
  }

  const order = {
    id: orderSnap.id,
    ...(orderSnap.data() as Omit<PaddlerOrder, "id">),
  }

  if (order.shipment?.status === "return_requested") {
    return order.shipment
  }

  const returnPayload = buildShiprocketReturnPayload(order)

  const returnData = await shiprocketFetch<Record<string, unknown>>(
    "/orders/create/return",
    {
      method: "POST",
      body: JSON.stringify(returnPayload),
    }
  )

  const returnShipment = {
    status: "return_requested",
    returnOrderId: returnData.order_id || null,
    returnShipmentId: returnData.shipment_id || null,
    returnStatus: returnData.status || "RETURN PENDING",
    returnResponse: returnData,
    updatedAt: new Date().toISOString(),
  }

  await updateDoc(orderRef, {
    "shipment.return": returnShipment,
    status: "return_requested",
    updatedAt: new Date().toISOString(),
  })

  return returnShipment
}
