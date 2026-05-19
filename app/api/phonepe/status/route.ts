import { NextResponse } from "next/server"
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { createShiprocketShipmentForOrder } from "@/lib/shiprocket"
import { deductSharedInventoryForItems } from "@/lib/inventory"

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

  if (upperState === "COMPLETED" || upperState === "SUCCESS") {
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

    const statusResponse = await fetchWithTimeout(
      `${apiBaseUrl}/checkout/v2/order/${orderId}/status`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `O-Bearer ${accessToken}`,
        },
      },
      12000
    )

    const statusData = await statusResponse.json().catch(() => null)

    if (!statusResponse.ok) {
      console.error("PHONEPE STATUS ERROR:", statusData)

      return NextResponse.json(
        {
          ok: false,
          message: "Unable to fetch PhonePe payment status.",
          details: statusData,
        },
        { status: 502 }
      )
    }

    const state =
      statusData?.state ||
      statusData?.data?.state ||
      statusData?.paymentDetails?.[0]?.state ||
      "PENDING"
    const { orderStatus, paymentStatus } = normalizePaymentState(String(state))

    await updateDoc(doc(db, "orders", orderId), {
      status: orderStatus,
      "payment.status": paymentStatus,
      "payment.phonepeState": state,
      phonepeStatus: statusData,
      updatedAt: new Date().toISOString(),
    })

    const invoicesQuery = query(
      collection(db, "invoices"),
      where("orderId", "==", orderId)
    )
    const invoiceSnap = await getDocs(invoicesQuery)

    await Promise.all(
      invoiceSnap.docs.map((invoiceDoc) =>
        updateDoc(doc(db, "invoices", invoiceDoc.id), {
          paymentStatus,
          phonepeState: state,
          updatedAt: new Date().toISOString(),
        })
      )
    )

    let shipment = null
    let shipmentError = null
    let inventoryError = null

    if (paymentStatus === "success") {
      try {
        const orderRef = doc(db, "orders", orderId)
        const orderSnap = await getDoc(orderRef)
        const order = orderSnap.exists() ? orderSnap.data() : null

        if (order && order.inventoryDeducted !== true) {
          await deductSharedInventoryForItems(order.items || [])
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
        await updateDoc(doc(db, "orders", orderId), {
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
      }
    }

    return NextResponse.json({
      ok: true,
      orderId,
      status: orderStatus,
      paymentStatus,
      phonepeState: state,
      phonepe: statusData,
      shipment,
      shipmentError,
      inventoryError,
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
