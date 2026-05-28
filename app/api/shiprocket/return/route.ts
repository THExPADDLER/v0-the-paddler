import { NextResponse } from "next/server"
import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore/lite"

import { serverDb } from "@/lib/firebase-server"
import { createShiprocketReturnForOrder } from "@/lib/shiprocket"
import { assertOrderAccess, requireUserRequest } from "@/lib/admin-auth"

const RTO_CHARGE = 70
const RETURN_WINDOW_DAYS = 3

const isReturnWindowOpen = (order: any) => {
  const deliveredAt = order.deliveredAt || order.updatedAt
  if (!deliveredAt) return true

  const deliveredDate = new Date(deliveredAt)
  if (Number.isNaN(deliveredDate.getTime())) return true

  const windowEndsAt = new Date(deliveredDate)
  windowEndsAt.setDate(windowEndsAt.getDate() + RETURN_WINDOW_DAYS)

  return Date.now() <= windowEndsAt.getTime()
}

export async function POST(request: Request) {
  try {
    const auth = await requireUserRequest(request)
    const {
      orderId,
      userId,
      customerEmail,
      reason = "Customer return request",
      description = "",
      imageUrl = "",
    } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        {
          ok: false,
          message: "orderId is required.",
        },
        { status: 400 }
      )
    }

    const orderRef = doc(serverDb, "orders", orderId)
    const orderSnap = await getDoc(orderRef)

    if (!orderSnap.exists()) {
      return NextResponse.json(
        {
          ok: false,
          message: "Order not found.",
        },
        { status: 404 }
      )
    }

    const order = orderSnap.data()
    assertOrderAccess(auth, order, "request a return for this order")

    if (order.status !== "delivered") {
      return NextResponse.json(
        {
          ok: false,
          message: "Return can be requested only after delivery.",
        },
        { status: 400 }
      )
    }

    if (!isReturnWindowOpen(order)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Returns and replacements are accepted only within 3 days of delivery.",
        },
        { status: 400 }
      )
    }

    const amount = Number(order?.pricing?.total || 0)
    const refundAmount = Math.max(amount - RTO_CHARGE, 0)
    const shiprocketReturn = await createShiprocketReturnForOrder(orderId)
    const now = new Date().toISOString()

    await addDoc(collection(serverDb, "returns"), {
      orderId,
      userId: userId || order.userId || "",
      customerEmail: customerEmail || order.customer?.email || "",
      items: order.items || [],
      amount,
      rtoCharge: RTO_CHARGE,
      refundAmount,
      reason,
      description: String(description).slice(0, 1000),
      imageUrl,
      status: "return_requested",
      pickupStatus: "shiprocket_return_created",
      refundStatus: "refund_after_rto_pickup",
      adminSeen: false,
      seenAt: null,
      shiprocketReturn,
      createdAt: now,
      updatedAt: now,
    })

    await updateDoc(orderRef, {
      status: "return_requested",
      returnRequested: true,
      returnRefundAmount: refundAmount,
      rtoCharge: RTO_CHARGE,
      updatedAt: now,
    })

    return NextResponse.json({
      ok: true,
      orderId,
      rtoCharge: RTO_CHARGE,
      refundAmount,
      shiprocketReturn,
      message: `Return requested. Refund amount will be Rs ${refundAmount} after deducting Rs ${RTO_CHARGE} RTO charges.`,
    })
  } catch (error) {
    console.error("SHIPROCKET RETURN ROUTE ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to create return request.",
      },
      { status: 500 }
    )
  }
}
