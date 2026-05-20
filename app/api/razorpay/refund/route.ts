import { NextResponse } from "next/server"
import { doc, getDoc, updateDoc } from "firebase/firestore/lite"

import { serverDb } from "@/lib/firebase-server"
import { razorpayFetch } from "@/lib/razorpay"

type RefundResponse = {
  id: string
  status: string
  amount: number
}

export async function POST(request: Request) {
  try {
    const { orderId, reason, cancelledBy } = await request.json()

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
    const payment = (order.payment || {}) as Record<string, unknown>
    const paymentStatus = String(payment.status || "pending")
    const razorpayPaymentId = String(payment.razorpayPaymentId || "")
    const now = new Date().toISOString()
    let refund: RefundResponse | null = null
    let refundStatus = "not_required"

    if (paymentStatus === "success") {
      if (!razorpayPaymentId) {
        throw new Error("Razorpay payment id is missing for refund.")
      }

      refund = await razorpayFetch<RefundResponse>(
        `/payments/${razorpayPaymentId}/refund`,
        {
          method: "POST",
          body: JSON.stringify({
            notes: {
              orderId,
              reason: reason || "Order cancelled",
              cancelledBy: cancelledBy || "admin",
            },
          }),
        }
      )
      refundStatus = refund.status || "created"
    }

    await updateDoc(orderRef, {
      status: "cancelled",
      cancelledAt: now,
      cancelledBy: cancelledBy || "admin",
      cancelReason: reason || "Order cancelled",
      "payment.refundStatus": refundStatus,
      "payment.razorpayRefund": refund,
      updatedAt: now,
    })

    return NextResponse.json({
      ok: true,
      orderId,
      refund,
      refundStatus,
      message:
        paymentStatus === "success"
          ? "Order cancelled. Razorpay refund has been initiated."
          : "Order cancelled.",
    })
  } catch (error) {
    console.error("RAZORPAY REFUND ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to cancel/refund Razorpay order.",
      },
      { status: 500 }
    )
  }
}
