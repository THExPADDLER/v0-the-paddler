import { NextResponse } from "next/server"

import { assertOrderAccess, requireUserRequest } from "@/lib/admin-auth"
import { sendEmail } from "@/lib/email"
import { firebaseProjectId } from "@/lib/firebase-config"

const projectId = firebaseProjectId
const firestoreBaseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`

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

type FirestoreValue = {
  stringValue?: string
  integerValue?: string
  doubleValue?: number
  booleanValue?: boolean
  nullValue?: null
  mapValue?: { fields?: Record<string, FirestoreValue> }
  arrayValue?: { values?: FirestoreValue[] }
}

type FirestoreDocument = {
  name: string
  fields?: Record<string, FirestoreValue>
}

const fromFirestoreValue = (value?: FirestoreValue): unknown => {
  if (!value) return undefined
  if ("stringValue" in value) return value.stringValue
  if ("integerValue" in value) return Number(value.integerValue)
  if ("doubleValue" in value) return value.doubleValue
  if ("booleanValue" in value) return value.booleanValue
  if ("nullValue" in value) return null
  if ("arrayValue" in value) {
    return (value.arrayValue?.values || []).map(fromFirestoreValue)
  }
  if ("mapValue" in value) {
    return fromFirestoreFields(value.mapValue?.fields || {})
  }

  return undefined
}

const fromFirestoreFields = (fields: Record<string, FirestoreValue>) => {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)])
  ) as Record<string, unknown>
}

const toFirestoreValue = (value: unknown): FirestoreValue => {
  if (value === null || value === undefined) return { nullValue: null }
  if (typeof value === "string") return { stringValue: value }
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value }
  }
  if (typeof value === "boolean") return { booleanValue: value }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } }
  }
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value as Record<string, unknown>).map(([key, item]) => [
            key,
            toFirestoreValue(item),
          ])
        ),
      },
    }
  }

  return { stringValue: String(value) }
}

const toFirestoreFields = (data: Record<string, unknown>) => {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, toFirestoreValue(value)])
  )
}

const getAuthHeader = (request: Request) => {
  const authorization = request.headers.get("authorization")

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Login token missing. Please refresh and try again.")
  }

  return authorization
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
    console.error("PHONEPE REFUND AUTH ERROR:", data)
    throw new Error("Unable to authenticate with PhonePe.")
  }

  const token = data?.access_token || data?.accessToken || data?.token

  if (!token) {
    console.error("PHONEPE REFUND TOKEN MISSING:", data)
    throw new Error("PhonePe auth token missing.")
  }

  return token
}

const createRefundId = (orderId: string) => {
  const cleanOrderId = orderId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)
  return `TPREF${cleanOrderId}${Date.now()}`
}

const updateFirestoreDocument = async (
  documentPath: string,
  authorization: string,
  data: Record<string, unknown>
) => {
  const updateMask = Object.keys(data)
    .map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`)
    .join("&")

  const response = await fetchWithTimeout(
    `${firestoreBaseUrl}/${documentPath}?${updateMask}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify({
        fields: toFirestoreFields(data),
      }),
    }
  )

  const responseData = await response.json().catch(() => null)

  if (!response.ok) {
    console.error("FIRESTORE UPDATE ERROR:", responseData)
    throw new Error(responseData?.error?.message || "Unable to update Firestore.")
  }

  return responseData
}

const findInvoiceDocuments = async (orderId: string, authorization: string) => {
  const response = await fetchWithTimeout(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "invoices" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "orderId" },
              op: "EQUAL",
              value: { stringValue: orderId },
            },
          },
        },
      }),
    }
  )

  const data = await response.json().catch(() => [])

  if (!response.ok) {
    console.error("FIRESTORE INVOICE QUERY ERROR:", data)
    return []
  }

  return (Array.isArray(data) ? data : []).reduce<FirestoreDocument[]>(
    (documents, item) => {
      if (item.document) {
        documents.push(item.document as FirestoreDocument)
      }

      return documents
    },
    []
  )
}

const getDocumentPath = (documentName: string) => {
  return documentName.split("/documents/")[1] || documentName
}

export async function POST(request: Request) {
  try {
    const auth = await requireUserRequest(request)
    const authorization = getAuthHeader(request)
    const {
      orderId,
      reason = "Customer requested cancellation",
      cancelledBy = "customer",
    } =
      await request.json()

    if (!orderId) {
      return NextResponse.json(
        {
          ok: false,
          message: "orderId is required.",
        },
        { status: 400 }
      )
    }

    const orderResponse = await fetchWithTimeout(
      `${firestoreBaseUrl}/orders/${encodeURIComponent(orderId)}`,
      {
        headers: {
          Authorization: authorization,
        },
      }
    )
    const orderDoc = (await orderResponse.json().catch(() => null)) as
      | FirestoreDocument
      | null

    if (!orderResponse.ok || !orderDoc?.fields) {
      return NextResponse.json(
        {
          ok: false,
          message: "Order not found or you do not have permission.",
        },
        { status: 404 }
      )
    }

    const order = fromFirestoreFields(orderDoc.fields)
    assertOrderAccess(auth, order, "cancel this order")

    if (cancelledBy === "admin" && auth.role !== "admin" && auth.role !== "staff") {
      return NextResponse.json(
        {
          ok: false,
          message: "Admin or staff access is required to cancel as admin.",
        },
        { status: 403 }
      )
    }

    const payment = (order.payment || {}) as Record<string, unknown>
    const pricing = (order.pricing || {}) as Record<string, unknown>
    const paymentStatus = String(payment.status || "pending")
    const currentStatus = String(order.status || "pending_payment")

    if (currentStatus === "cancelled") {
      return NextResponse.json({
        ok: true,
        orderId,
        status: "cancelled",
        refundStatus: payment.refundStatus || "not_required",
        message: "Order is already cancelled.",
      })
    }

    if (["shipped", "in_transit", "delivered"].includes(currentStatus)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "This order has already been shipped and cannot be cancelled. It will be delivered to the given address. You can request a return after delivery.",
        },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    let refundData = null
    let refundStatus = "not_required"
    let merchantRefundId = null

    if (paymentStatus === "success") {
      const { apiBaseUrl } = getPhonePeConfig()
      const accessToken = await getAccessToken()
      const amountInPaise = Math.round(Number(pricing.total || 0) * 100)

      if (amountInPaise <= 0) {
        throw new Error("Refund amount is invalid.")
      }

      merchantRefundId = createRefundId(orderId)

      const refundResponse = await fetchWithTimeout(
        `${apiBaseUrl}/payments/v2/refund`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `O-Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            merchantRefundId,
            originalMerchantOrderId: orderId,
            amount: amountInPaise,
          }),
        }
      )

      refundData = await refundResponse.json().catch(() => null)

      if (!refundResponse.ok) {
        console.error("PHONEPE REFUND ERROR:", refundData)
        refundStatus = "refund_failed"
      } else {
        refundStatus = "refund_initiated"
      }
    }

    await updateFirestoreDocument(`orders/${encodeURIComponent(orderId)}`, authorization, {
      status: "cancelled",
      cancellation: {
        reason,
        cancelledAt: now,
        refundStatus,
        merchantRefundId,
        refundResponse: refundData,
      },
      payment: {
        ...payment,
        refundStatus,
        merchantRefundId,
        refundResponse: refundData,
      },
      updatedAt: now,
    })

    const invoiceDocs = await findInvoiceDocuments(orderId, authorization)

    await Promise.all(
      invoiceDocs.map((invoiceDoc) =>
        updateFirestoreDocument(
          getDocumentPath(invoiceDoc.name),
          authorization,
          {
            orderStatus: "cancelled",
            refundStatus,
            merchantRefundId,
            updatedAt: now,
          }
        )
      )
    )

    const customer = (order.customer || {}) as Record<string, unknown>
    let emailResult = null

    if (cancelledBy === "admin") {
      emailResult = await sendEmail({
        to: String(customer.email || ""),
        subject: `THE PADDLER order #${orderId} has been cancelled`,
        text: `Hi ${customer.name || "Customer"},\n\nYour order #${orderId} has been cancelled by THE PADDLER team.\n\nRefund status: ${refundStatus}.\n\nIf payment was completed, the refund will be processed to the original payment account as per the payment gateway timeline.\n\nTHE PADDLER`,
      })
    }

    return NextResponse.json({
      ok: refundStatus !== "refund_failed",
      orderId,
      status: "cancelled",
      refundStatus,
      merchantRefundId,
      refund: refundData,
      email: emailResult,
      message:
        refundStatus === "refund_failed"
          ? "Order cancelled, but PhonePe refund failed. Process refund manually."
          : paymentStatus === "success"
          ? "Order cancelled and refund initiated."
          : "Order cancelled. No refund required.",
    })
  } catch (error) {
    console.error("PHONEPE REFUND ROUTE ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to cancel/refund order.",
      },
      { status: 500 }
    )
  }
}
