import { after, NextResponse } from "next/server"
import { collection, doc, getDoc, getDocs, query, runTransaction, updateDoc, where } from "firebase/firestore/lite"

import { serverDb } from "@/lib/firebase-server"
import { createShiprocketShipmentForOrder } from "@/lib/shiprocket"
import { createInventoryKey, emptySizeStock, type SizeStock } from "@/lib/inventory"

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

const getPhonePeConfig = () => {
  const clientId = process.env.PHONEPE_CLIENT_ID
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET
  const clientVersion = process.env.PHONEPE_CLIENT_VERSION || "1"
  const apiBaseUrl =
    process.env.PHONEPE_API_BASE_URL ||
    "https://api-preprod.phonepe.com/apis/pg-sandbox"

  if (!clientId || !clientSecret) {
    throw new Error("PhonePe client id/secret is missing.")
  }

  return {
    clientId,
    clientSecret,
    clientVersion,
    apiBaseUrl,
  }
}

async function getAccessToken() {
  const { clientId, clientSecret, clientVersion, apiBaseUrl } = getPhonePeConfig()

  const response = await fetchWithTimeout(`${apiBaseUrl}/v1/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_version: clientVersion,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    console.error("PHONEPE STATUS AUTH ERROR:", data)
    throw new Error("Unable to authenticate with PhonePe.")
  }

  const token = data?.access_token || data?.accessToken || data?.token

  if (!token) {
    console.error("PHONEPE STATUS TOKEN MISSING:", data)
    throw new Error("PhonePe auth token missing.")
  }

  return token
}

const normalizePaymentState = (state: string) => {
  const upperState = state.toUpperCase()

  if (
    upperState === "COMPLETED" ||
    upperState === "SUCCESS" ||
    upperState === "PAYMENT_SUCCESS" ||
    upperState === "PAYMENT_COMPLETED" ||
    upperState === "CAPTURED"
  ) {
    return {
      orderStatus: "paid",
      paymentStatus: "success",
    }
  }

  if (upperState === "FAILED" || upperState === "FAILURE") {
    return {
      orderStatus: "payment_failed",
      paymentStatus: "failed",
    }
  }

  return {
    orderStatus: "pending_payment",
    paymentStatus: "pending",
  }
}

const collectStatusValues = (value: unknown): string[] => {
  if (!value || typeof value !== "object") return []

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectStatusValues(item))
  }

  const record = value as Record<string, unknown>
  const current = [
    record.state,
    record.status,
    record.paymentState,
    record.transactionStatus,
    record.code,
  ].filter((item): item is string => typeof item === "string")

  return [
    ...current,
    ...Object.values(record).flatMap((item) => collectStatusValues(item)),
  ]
}

const pickPaymentState = (statusData: any) => {
  const candidates = collectStatusValues(statusData)
  const successState = candidates.find(
    (item) => normalizePaymentState(item).paymentStatus === "success"
  )

  if (successState) return successState

  const failedState = candidates.find(
    (item) => normalizePaymentState(item).paymentStatus === "failed"
  )

  if (failedState) return failedState

  return (
    statusData?.state ||
    statusData?.data?.state ||
    statusData?.paymentDetails?.[0]?.state ||
    statusData?.data?.paymentDetails?.[0]?.state ||
    "PENDING"
  )
}

const readJsonResponse = async (response: Response) => {
  const text = await response.text().catch(() => "")

  if (!text.trim()) {
    return {
      data: null,
      text,
    }
  }

  try {
    return {
      data: JSON.parse(text),
      text,
    }
  } catch (error) {
    console.error("PHONEPE STATUS JSON PARSE ERROR:", {
      status: response.status,
      text: text.slice(0, 500),
      error,
    })

    return {
      data: null,
      text,
    }
  }
}

const getTransactionReference = (statusData: any) => {
  return (
    statusData?.paymentDetails?.[0]?.transactionId ||
    statusData?.paymentDetails?.[0]?.rail?.utr ||
    statusData?.paymentDetails?.[0]?.rail?.upiTransactionId ||
    statusData?.data?.paymentDetails?.[0]?.transactionId ||
    statusData?.data?.paymentDetails?.[0]?.rail?.utr ||
    null
  )
}

const deductSharedInventoryForItemsServer = async (
  items: Array<{
    description?: string
    quantity?: number
    size?: string
    color?: string
  }>
) => {
  const grouped = items.reduce<Record<string, { color: string; sizes: SizeStock }>>(
    (acc, item) => {
      const color = item.color || item.description?.split("/")[0]?.trim() || ""
      const key = createInventoryKey(color)

      if (!key || !item.size) return acc

      if (!acc[key]) {
        acc[key] = {
          color,
          sizes: {},
        }
      }

      acc[key].sizes[item.size] =
        Number(acc[key].sizes[item.size] || 0) + Number(item.quantity || 0)

      return acc
    },
    {}
  )

  await Promise.all(
    Object.entries(grouped).map(([key, group]) =>
      runTransaction(serverDb, async (transaction) => {
        const inventoryRef = doc(serverDb, "inventory", key)
        const snapshot = await transaction.get(inventoryRef)
        const currentStock = snapshot.exists()
          ? ((snapshot.data().stockBySize || {}) as SizeStock)
          : emptySizeStock

        const nextStock: SizeStock = {
          ...emptySizeStock,
          ...currentStock,
        }

        Object.entries(group.sizes).forEach(([size, quantity]) => {
          if (Number(nextStock[size] || 0) < quantity) {
            throw new Error(
              `Insufficient ${group.color} stock in size ${size}.`
            )
          }

          nextStock[size] = Math.max(0, Number(nextStock[size] || 0) - quantity)
        })

        transaction.set(
          inventoryRef,
          {
            color: group.color,
            stockBySize: nextStock,
            stock: Object.values(nextStock).reduce(
              (sum, value) => sum + Number(value || 0),
              0
            ),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        )
      })
    )
  )
}

const runSuccessSideEffects = async (orderId: string) => {
  let shipment = null
  let shipmentError = null
  let inventoryError = null

  try {
    const orderRef = doc(serverDb, "orders", orderId)
    const orderSnap = await getDoc(orderRef)
    const order = orderSnap.exists() ? orderSnap.data() : null

    if (order && order.inventoryDeducted !== true) {
      await deductSharedInventoryForItemsServer(order.items || [])
      await updateDoc(orderRef, {
        inventoryDeducted: true,
        inventoryDeductedAt: new Date().toISOString(),
        inventoryError: null,
      })
    }
  } catch (error) {
    inventoryError =
      error instanceof Error
        ? error.message
        : "Unable to deduct shared inventory."
    console.error("INVENTORY AFTER PAYMENT ERROR:", {
      orderId,
      error,
    })
    await updateDoc(doc(serverDb, "orders", orderId), {
      inventoryError,
      updatedAt: new Date().toISOString(),
    })
  }

  try {
    shipment = await createShiprocketShipmentForOrder(orderId)
  } catch (error) {
    shipmentError =
      error instanceof Error
        ? error.message
        : "Unable to create Shiprocket shipment."
    console.error("SHIPROCKET AFTER PAYMENT ERROR:", {
      orderId,
      error,
    })

    await updateDoc(doc(serverDb, "orders", orderId), {
      shipmentError,
      updatedAt: new Date().toISOString(),
    })
  }

  return {
    shipment,
    shipmentError,
    inventoryError,
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const orderId = url.searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json(
        {
          ok: false,
          message: "orderId is required.",
        },
        { status: 400 }
      )
    }

    const { apiBaseUrl } = getPhonePeConfig()
    const accessToken = await getAccessToken()
    const orderRef = doc(serverDb, "orders", orderId)
    const orderSnap = await getDoc(orderRef)
    const orderData = orderSnap.exists() ? orderSnap.data() : null
    const paymentData = (orderData?.payment || {}) as Record<string, unknown>
    const merchantOrderId = String(
      paymentData.phonepeMerchantOrderId || orderId
    )

    let statusResponse = await fetchWithTimeout(
      `${apiBaseUrl}/checkout/v2/order/${merchantOrderId}/status?details=true`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `O-Bearer ${accessToken}`,
        },
      },
      12000
    )

    let { data: statusData, text: statusText } = await readJsonResponse(
      statusResponse
    )

    if (statusResponse.ok && !statusData) {
      console.warn("PHONEPE STATUS EMPTY BODY: retrying with details=true.", {
        orderId,
        merchantOrderId,
        status: statusResponse.status,
        bodyLength: statusText.length,
      })

      statusResponse = await fetchWithTimeout(
        `${apiBaseUrl}/checkout/v2/order/${merchantOrderId}/status?details=false`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `O-Bearer ${accessToken}`,
          },
        },
        12000
      )

      const retried = await readJsonResponse(statusResponse)
      statusData = retried.data
      statusText = retried.text
    }

    if (!statusResponse.ok) {
      console.error("PHONEPE STATUS ERROR:", {
        orderId,
        merchantOrderId,
        status: statusResponse.status,
        statusData,
        statusText: statusText.slice(0, 500),
      })

      return NextResponse.json(
        {
          ok: false,
          message: "Unable to fetch PhonePe payment status.",
          details: statusData,
        },
        { status: 502 }
      )
    }

    if (!statusData) {
      return NextResponse.json({
        ok: true,
        orderId,
        merchantOrderId,
        status: "pending_payment",
        paymentStatus: "pending",
        phonepeState: "NO_STATUS_BODY",
        needsManualVerification: true,
        message:
          "PhonePe has not returned a readable status yet. Please try Check Payment Status again in a moment.",
      })
    }

    const state = pickPaymentState(statusData)
    const { orderStatus, paymentStatus } = normalizePaymentState(String(state))
    const transactionReference = getTransactionReference(statusData)

    await updateDoc(orderRef, {
      status: orderStatus,
      "payment.status": paymentStatus,
      "payment.phonepeState": state,
      "payment.phonepeMerchantOrderId": merchantOrderId,
      "payment.phonepeGatewayOrderId": statusData?.orderId || null,
      "payment.transactionReference": transactionReference,
      phonepeStatus: statusData,
      updatedAt: new Date().toISOString(),
    })

    const invoicesQuery = query(
      collection(serverDb, "invoices"),
      where("orderId", "==", orderId)
    )
    const invoiceSnap = await getDocs(invoicesQuery)

    await Promise.all(
      invoiceSnap.docs.map((invoiceDoc) =>
        updateDoc(doc(serverDb, "invoices", invoiceDoc.id), {
          paymentStatus,
          phonepeState: state,
          updatedAt: new Date().toISOString(),
        })
      )
    )

    if (paymentStatus === "success") {
      after(() => runSuccessSideEffects(orderId))
    }

    return NextResponse.json({
      ok: true,
      orderId,
      merchantOrderId,
      status: orderStatus,
      paymentStatus,
      phonepeState: state,
      phonepe: statusData,
      transactionReference,
      shipmentQueued: paymentStatus === "success",
    })
  } catch (error) {
    console.error("PHONEPE STATUS CHECK ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to check PhonePe status.",
      },
      { status: 500 }
    )
  }
}
