import { NextResponse } from "next/server"
import { doc, getDoc, updateDoc } from "firebase/firestore/lite"

import { serverDb } from "@/lib/firebase-server"
import { getRazorpayKeyId, razorpayFetch } from "@/lib/razorpay"
import { assertOrderAccess, requireUserRequest } from "@/lib/admin-auth"

type RazorpayOrder = {
  id: string
  amount: number
  currency: string
  receipt?: string
  status?: string
}

export async function POST(request: Request) {
  try {
    const auth = await requireUserRequest(request)
    const { orderId, amount, customer } = await request.json()

    if (!orderId || !amount) {
      return NextResponse.json(
        {
          ok: false,
          message: "orderId and amount are required.",
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
    assertOrderAccess(auth, order, "pay for this order")

    const amountInPaise = Math.round(Number(amount) * 100)
    const razorpayOrder = await razorpayFetch<RazorpayOrder>("/orders", {
      method: "POST",
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: orderId,
        notes: {
          appOrderId: orderId,
          customerEmail: customer?.email || "",
          customerPhone: customer?.phone || "",
          brand: "THE PADDLER",
        },
      }),
    })

    await updateDoc(orderRef, {
      "payment.gateway": "razorpay",
      "payment.status": "pending",
      "payment.razorpayOrderId": razorpayOrder.id,
      "payment.razorpayOrder": razorpayOrder,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      ok: true,
      keyId: getRazorpayKeyId(),
      orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    })
  } catch (error) {
    console.error("RAZORPAY CREATE ORDER ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to create Razorpay order.",
      },
      { status: 500 }
    )
  }
}
