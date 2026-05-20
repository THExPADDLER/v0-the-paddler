import { NextResponse } from "next/server"
import crypto from "crypto"
import { collection, doc, getDoc, getDocs, query, runTransaction, updateDoc, where } from "firebase/firestore/lite"

import { serverDb } from "@/lib/firebase-server"
import { createShiprocketShipmentForOrder } from "@/lib/shiprocket"
import { createInventoryKey, emptySizeStock, type SizeStock } from "@/lib/inventory"

const getWebhookCredentials = () => ({
  username: process.env.PHONEPE_WEBHOOK_USERNAME || "",
  password: process.env.PHONEPE_WEBHOOK_PASSWORD || "",
})

const parseBasicAuth = (header: string | null) => {
  if (!header?.startsWith("Basic ")) return null

  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8")
    const separatorIndex = decoded.indexOf(":")

    if (separatorIndex === -1) return null

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    }
  } catch {
    return null
  }
}

const createPhonePeWebhookHash = (username: string, password: string) => {
  return crypto
    .createHash("sha256")
    .update(`${username}:${password}`)
    .digest("hex")
}

const isWebhookAuthorized = (request: Request) => {
  const authRequired = process.env.PHONEPE_WEBHOOK_AUTH_REQUIRED === "true"
  const expected = getWebhookCredentials()

  if (!authRequired) {
    console.warn("PHONEPE WEBHOOK AUTH RELAXED: accepting webhook in test mode.")
    return true
  }

  if (!expected.username || !expected.password) {
    console.error("PHONEPE WEBHOOK AUTH ERROR: credentials not configured.")
    return false
  }

  const authHeader = request.headers.get("authorization") || ""
  const expectedHash = createPhonePeWebhookHash(
    expected.username,
    expected.password
  )
  const receivedBasic = parseBasicAuth(authHeader)
  const receivedHash = authHeader
    .replace(/^SHA256\s+/i, "")
    .replace(/^sha256=/i, "")
    .replace(/^SHA256\(/i, "")
    .replace(/\)$/i, "")
    .trim()

  return (
    receivedHash === expectedHash ||
    (receivedBasic?.username === expected.username &&
      receivedBasic?.password === expected.password)
  )
}

const findValueByKeys = (value: unknown, keys: string[]): string | null => {
  if (!value || typeof value !== "object") return null

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findValueByKeys(item, keys)
      if (found) return found
    }

    return null
  }

  const record = value as Record<string, unknown>

  for (const key of keys) {
    const match = record[key]

    if (typeof match === "string" && match.trim()) {
      return match.trim()
    }
  }

  for (const nested of Object.values(record)) {
    const found = findValueByKeys(nested, keys)
    if (found) return found
  }

  return null
}

const getEventName = (body: any) =>
  String(
    body?.event ||
      body?.eventName ||
      body?.type ||
      body?.data?.event ||
      body?.payload?.event ||
      ""
  )

const normalizePaymentStatus = (eventName: string, body: any) => {
  const state = String(
    findValueByKeys(body, ["state", "status", "paymentState", "transactionStatus"]) ||
      eventName
  ).toLowerCase()

  if (
    eventName === "checkout.order.completed" ||
    eventName === "pg.order.completed" ||
    state.includes("completed") ||
    state.includes("success")
  ) {
    return {
      orderStatus: "paid",
      paymentStatus: "success",
      phonepeState: eventName || state,
    }
  }

  if (
    eventName === "checkout.order.failed" ||
    eventName === "pg.order.failed" ||
    state.includes("failed") ||
    state.includes("failure")
  ) {
    return {
      orderStatus: "payment_failed",
      paymentStatus: "failed",
      phonepeState: eventName || state,
    }
  }

  return {
    orderStatus: "payment_update_received",
    paymentStatus: "pending",
    phonepeState: eventName || state || "callback_received",
  }
}

const syncInvoicePayment = async (
  orderId: string,
  paymentStatus: string,
  phonepeState: string
) => {
  const invoicesQuery = query(
    collection(serverDb, "invoices"),
    where("orderId", "==", orderId)
  )
  const invoiceSnap = await getDocs(invoicesQuery)

  await Promise.all(
    invoiceSnap.docs.map((invoiceDoc) =>
      updateDoc(doc(serverDb, "invoices", invoiceDoc.id), {
        paymentStatus,
        phonepeState,
        updatedAt: new Date().toISOString(),
      })
    )
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
  let inventoryError = null
  let shipment = null
  let shipmentError = null

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
    console.error("PHONEPE CALLBACK INVENTORY ERROR:", { orderId, error })
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
    console.error("PHONEPE CALLBACK SHIPROCKET ERROR:", { orderId, error })

    await updateDoc(doc(serverDb, "orders", orderId), {
      shipmentError,
      updatedAt: new Date().toISOString(),
    })
  }

  return {
    inventoryError,
    shipment,
    shipmentError,
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/phonepe/callback",
    message: "PhonePe callback endpoint is available.",
  })
}

export async function POST(request: Request) {
  try {
    if (!isWebhookAuthorized(request)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Unauthorized webhook.",
        },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => null)

    console.log("PHONEPE CALLBACK:", body)

    const merchantOrderId =
      findValueByKeys(body, [
        "merchantOrderId",
        "merchantTransactionId",
        "merchant_order_id",
      ]) || ""
    const eventName = getEventName(body)
    const { orderStatus, paymentStatus, phonepeState } = normalizePaymentStatus(
      eventName,
      body
    )
    const transactionReference = findValueByKeys(body, [
      "transactionId",
      "transactionReference",
      "providerReferenceId",
      "paymentId",
    ])

    if (merchantOrderId) {
      await updateDoc(doc(serverDb, "orders", merchantOrderId), {
        status: orderStatus,
        "payment.status": paymentStatus,
        "payment.phonepeState": phonepeState,
        "payment.transactionReference": transactionReference || null,
        phonepeCallback: body,
        phonepeCallbackEvent: eventName,
        updatedAt: new Date().toISOString(),
      })

      await syncInvoicePayment(merchantOrderId, paymentStatus, phonepeState)

      if (paymentStatus === "success") {
        runSuccessSideEffects(merchantOrderId).catch((error) => {
          console.error("PHONEPE CALLBACK SIDE EFFECTS ERROR:", {
            orderId: merchantOrderId,
            error,
          })
        })
      }

      return NextResponse.json({
        ok: true,
        message: "PhonePe callback processed.",
        orderId: merchantOrderId,
        paymentStatus,
        phonepeState,
      })
    }

    return NextResponse.json({
      ok: true,
      message: "PhonePe callback received, but merchant order id was missing.",
    })
  } catch (error) {
    console.error("PHONEPE CALLBACK ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Unable to process PhonePe callback.",
      },
      { status: 500 }
    )
  }
}
