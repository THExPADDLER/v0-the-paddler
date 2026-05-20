import { after, NextResponse } from "next/server"
import crypto from "crypto"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore/lite"

import { serverDb } from "@/lib/firebase-server"
import { getRazorpayKeySecret } from "@/lib/razorpay"
import {
  createInventoryKey,
  emptySizeStock,
  type SizeStock,
} from "@/lib/inventory"
import { createShiprocketShipmentForOrder } from "@/lib/shiprocket"

const verifySignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
) => {
  const expected = crypto
    .createHmac("sha256", getRazorpayKeySecret())
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex")

  return (
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
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

const syncInvoicePayment = async (orderId: string) => {
  const invoicesQuery = query(
    collection(serverDb, "invoices"),
    where("orderId", "==", orderId)
  )
  const invoiceSnap = await getDocs(invoicesQuery)

  await Promise.all(
    invoiceSnap.docs.map((invoiceDoc) =>
      updateDoc(doc(serverDb, "invoices", invoiceDoc.id), {
        paymentStatus: "success",
        razorpayState: "signature_verified",
        updatedAt: new Date().toISOString(),
      })
    )
  )
}

const runSuccessSideEffects = async (orderId: string) => {
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
    console.error("RAZORPAY INVENTORY ERROR:", { orderId, error })
    await updateDoc(doc(serverDb, "orders", orderId), {
      inventoryError:
        error instanceof Error
          ? error.message
          : "Unable to deduct shared inventory.",
      updatedAt: new Date().toISOString(),
    })
  }

  try {
    await createShiprocketShipmentForOrder(orderId)
  } catch (error) {
    console.error("RAZORPAY SHIPROCKET ERROR:", { orderId, error })
    await updateDoc(doc(serverDb, "orders", orderId), {
      shipmentError:
        error instanceof Error
          ? error.message
          : "Unable to create Shiprocket shipment.",
      updatedAt: new Date().toISOString(),
    })
  }
}

export async function POST(request: Request) {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await request.json()

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Missing Razorpay verification fields.",
        },
        { status: 400 }
      )
    }

    if (
      !verifySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Razorpay signature verification failed.",
        },
        { status: 400 }
      )
    }

    await updateDoc(doc(serverDb, "orders", orderId), {
      status: "paid",
      "payment.gateway": "razorpay",
      "payment.status": "success",
      "payment.razorpayOrderId": razorpay_order_id,
      "payment.razorpayPaymentId": razorpay_payment_id,
      "payment.razorpaySignature": razorpay_signature,
      "payment.verifiedAt": new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    await syncInvoicePayment(orderId)
    after(() => runSuccessSideEffects(orderId))

    return NextResponse.json({
      ok: true,
      orderId,
      paymentStatus: "success",
      shipmentQueued: true,
    })
  } catch (error) {
    console.error("RAZORPAY VERIFY ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to verify Razorpay payment.",
      },
      { status: 500 }
    )
  }
}
