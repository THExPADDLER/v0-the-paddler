import { NextResponse } from "next/server"
import { doc, getDoc, updateDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { deductSharedInventoryForItems } from "@/lib/inventory"

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        {
          ok: false,
          message: "orderId is required.",
        },
        { status: 400 }
      )
    }

    const orderRef = doc(db, "orders", orderId)
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

    if (order.payment?.status !== "success") {
      return NextResponse.json(
        {
          ok: false,
          message: "Inventory can be deducted only after successful payment.",
        },
        { status: 400 }
      )
    }

    if (order.inventoryDeducted === true) {
      return NextResponse.json({
        ok: true,
        message: "Inventory was already deducted for this order.",
      })
    }

    await deductSharedInventoryForItems(order.items || [])

    await updateDoc(orderRef, {
      inventoryDeducted: true,
      inventoryDeductedAt: new Date().toISOString(),
      inventoryError: null,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      ok: true,
      message: "Inventory deducted successfully.",
    })
  } catch (error) {
    console.error("INVENTORY DEDUCT API ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to deduct inventory.",
      },
      { status: 500 }
    )
  }
}
