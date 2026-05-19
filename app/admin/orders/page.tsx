"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle2, Clock3, Package, RefreshCcw, Truck } from "lucide-react"
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"
import { auth } from "@/lib/firebase"
import { db } from "@/lib/firebase"
import { deductSharedInventoryForItems } from "@/lib/inventory"
import type { CartItem } from "@/lib/cart-context"

type AdminOrder = {
  id: string
  invoiceNumber?: string
  items?: CartItem[]
  customer?: {
    name?: string
    email?: string
    phone?: string
  }
  address?: {
    address?: string
    landmark?: string
    city?: string
    state?: string
    pincode?: string
  }
  pricing?: {
    total?: number
    couponCode?: string | null
  }
  payment?: {
    status?: string
    gateway?: string
  }
  status?: string
  inventoryDeducted?: boolean
  inventoryError?: string | null
  shipment?: {
    awb?: string
    shipmentId?: string
    courier?: string
  }
  createdAt?: string
}

const formatStatus = (status = "pending") =>
  status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [checkingPaymentId, setCheckingPaymentId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [deductingInventoryId, setDeductingInventoryId] = useState<string | null>(null)
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(ordersQuery)

      setOrders(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<AdminOrder, "id">),
        }))
      )
    } catch (error) {
      console.error("ADMIN ORDERS FETCH ERROR:", error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const updateStatus = async (order: AdminOrder, status: string) => {
    const paymentStatus = order.payment?.status || "pending"
    const needsShipment = ["shipped", "in_transit", "delivered"].includes(status)

    if (paymentStatus !== "success") {
      alert("Payment is not successful yet. Check payment status before updating this order.")
      return
    }

    if (needsShipment && !order.shipment?.awb && !order.shipment?.shipmentId) {
      alert("Shipment is not created yet. Create/check Shiprocket shipment first.")
      return
    }

    const orderId = order.id
    setUpdatingId(orderId)

    try {
      await updateDoc(doc(db, "orders", orderId), {
        status,
        updatedAt: new Date().toISOString(),
      })
      await fetchOrders()
    } catch (error) {
      console.error("ORDER STATUS UPDATE ERROR:", error)
      alert("Unable to update order status.")
    } finally {
      setUpdatingId(null)
    }
  }

  const checkPaymentAndShipment = async (order: AdminOrder) => {
    setCheckingPaymentId(order.id)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20000)
      const response = await fetch(
        `/api/phonepe/status?orderId=${encodeURIComponent(order.id)}`,
        { signal: controller.signal }
      )
      clearTimeout(timeout)
      const data = await response.json()

      if (!response.ok || !data?.ok) {
        console.error("ADMIN PAYMENT CHECK ERROR:", data)
        alert(data?.message || "Unable to check payment status.")
        return
      }

      await fetchOrders()

      if (data.paymentStatus === "success") {
        alert(
          data.shipmentError
            ? `Payment successful, but Shiprocket failed: ${data.shipmentError}`
            : "Payment successful. Shiprocket shipment creation has been triggered."
        )
        return
      }

      if (data.needsManualVerification) {
        alert(
          "PhonePe returned no readable status body. Verify this transaction in the PhonePe dashboard, then use Mark Paid."
        )
        return
      }

      alert(`Current payment status: ${formatStatus(data.paymentStatus || "pending")}`)
    } catch (error) {
      console.error("ADMIN PAYMENT CHECK ERROR:", error)
      alert("Unable to check payment status.")
    } finally {
      setCheckingPaymentId(null)
    }
  }

  const cancelOrder = async (order: AdminOrder) => {
    if (order.status === "cancelled") {
      alert("This order is already cancelled.")
      return
    }

    if (order.status === "delivered") {
      alert("Delivered orders cannot be cancelled. Use return flow instead.")
      return
    }

    if (["shipped", "in_transit"].includes(order.status || "")) {
      alert("This order has already been shipped and cannot be cancelled.")
      return
    }

    const confirmed = window.confirm(
      order.payment?.status === "success"
        ? "Cancel this order and initiate refund to original payment account?"
        : "Cancel this order?"
    )

    if (!confirmed) return

    setCancellingId(order.id)

    try {
      const response = await fetch("/api/phonepe/refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          reason: "Admin cancelled from order panel",
          cancelledBy: "admin",
        }),
      })
      const data = await response.json()

      await fetchOrders()
      alert(data?.message || "Cancellation request completed.")
    } catch (error) {
      console.error("ADMIN CANCEL ORDER ERROR:", error)
      alert("Unable to cancel order.")
    } finally {
      setCancellingId(null)
    }
  }

  const retryInventoryDeduction = async (order: AdminOrder) => {
    if (order.payment?.status !== "success") {
      alert("Payment is not successful yet.")
      return
    }

    setDeductingInventoryId(order.id)

    try {
      const response = await fetch("/api/inventory/deduct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
        }),
      })
      const data = await response.json()

      if (!response.ok || !data?.ok) {
        alert(data?.message || "Unable to deduct inventory.")
        return
      }

      await fetchOrders()
      alert(data.message || "Inventory deducted successfully.")
    } catch (error) {
      console.error("ADMIN INVENTORY DEDUCT ERROR:", error)
      alert("Unable to deduct inventory.")
    } finally {
      setDeductingInventoryId(null)
    }
  }

  const markPaidAfterVerification = async (order: AdminOrder) => {
    const transactionReference = window.prompt(
      "Enter PhonePe transaction reference from the PhonePe dashboard. Example: OMO..."
    )

    if (transactionReference === null) return

    const confirmed = window.confirm(
      "Only continue if PhonePe dashboard shows this payment as COMPLETED. Mark this order as paid?"
    )

    if (!confirmed) return

    setMarkingPaidId(order.id)

    try {
      const now = new Date().toISOString()

      await updateDoc(doc(db, "orders", order.id), {
        status: "paid",
        "payment.status": "success",
        "payment.phonepeState": "ADMIN_VERIFIED",
        "payment.verifiedByAdmin": true,
        "payment.verifiedAt": now,
        "payment.transactionReference": transactionReference.trim() || null,
        updatedAt: now,
      })

      let inventoryError = null
      let shipmentError = null

      if (!order.inventoryDeducted) {
        try {
          await deductSharedInventoryForItems(order.items || [])
          await updateDoc(doc(db, "orders", order.id), {
            inventoryDeducted: true,
            inventoryDeductedAt: new Date().toISOString(),
            inventoryError: null,
          })
        } catch (error) {
          inventoryError =
            error instanceof Error
              ? error.message
              : "Unable to deduct shared inventory."
          await updateDoc(doc(db, "orders", order.id), {
            inventoryError,
            updatedAt: new Date().toISOString(),
          })
        }
      }

      const response = await fetch("/api/shiprocket/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order: {
            ...order,
            status: "paid",
            payment: {
              ...(order.payment || {}),
              status: "success",
            },
          },
        }),
      })
      const data = await response.json()

      if (response.ok && data?.ok && data.shipment) {
        await updateDoc(doc(db, "orders", order.id), {
          shipment: data.shipment,
          trackingId: data.shipment.awb || data.shipment.shipmentId,
          trackingUrl: data.shipment.trackingUrl,
          status: "processing",
          updatedAt: new Date().toISOString(),
        })
      } else {
        shipmentError = data?.message || "Unable to create Shiprocket shipment."
      }

      await fetchOrders()
      alert(
        shipmentError || inventoryError
          ? `Payment marked paid. Attention needed: ${shipmentError || inventoryError}`
          : "Payment marked paid. Inventory and shipment sync attempted."
      )
    } catch (error) {
      console.error("ADMIN MARK PAID ERROR:", error)
      alert("Unable to mark order paid.")
    } finally {
      setMarkingPaidId(null)
    }
  }

  return (
    <ProtectedRoute adminOnly>
      <>
        <Header />

        <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              ORDER CONTROL
            </p>

            <h1 className="text-4xl font-black mb-10">ORDERS</h1>

            <div className="space-y-6">
              {loading ? (
                <div className="border border-border bg-secondary/20 p-6 text-muted-foreground">
                  Loading orders...
                </div>
              ) : orders.length === 0 ? (
                <div className="border border-border bg-secondary/20 p-6 text-muted-foreground">
                  No orders found.
                </div>
              ) : (
                orders.map((order) => {
                  const firstItem = order.items?.[0]
                  const paymentStatus = order.payment?.status || "pending"
                  const isPaid = paymentStatus === "success"
                  const hasShipment = Boolean(
                    order.shipment?.awb || order.shipment?.shipmentId
                  )

                  return (
                    <div
                      key={order.id}
                      className="border border-border bg-secondary/20 p-6"
                    >
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="relative w-24 h-28 bg-neutral-900 overflow-hidden">
                          {firstItem?.image && (
                            <Image
                              src={firstItem.image}
                              alt={firstItem.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>

                        <div className="flex-1 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div>
                            <p className="text-xs text-muted-foreground">ORDER ID</p>
                            <h2 className="font-black break-all">#{order.id}</h2>
                            <p className="text-xs text-muted-foreground mt-2">
                              Invoice: {order.invoiceNumber || order.id}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">CUSTOMER</p>
                            <h2 className="font-black">
                              {order.customer?.name || "Customer"}
                            </h2>
                            <p className="text-sm text-muted-foreground break-all">
                              {order.customer?.email || "No email"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.customer?.phone || "No phone"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">PRODUCT</p>
                            <h2 className="font-black">
                              {firstItem?.name || "Order items"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              {order.items?.length || 0} item
                              {(order.items?.length || 0) === 1 ? "" : "s"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">AMOUNT</p>
                            <h2 className="font-black">
                              ₹{Number(order.pricing?.total || 0).toLocaleString("en-IN")}
                            </h2>
                            <p
                              className={`text-sm ${
                                isPaid
                                  ? "text-green-400"
                                  : paymentStatus === "failed"
                                  ? "text-red-400"
                                  : "text-yellow-400"
                              }`}
                            >
                              {formatStatus(paymentStatus)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 border-t border-border pt-6 grid lg:grid-cols-3 gap-6">
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">STATUS</p>
                          <p className="font-black text-yellow-400">
                            {formatStatus(order.status)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-2">
                            SHIPMENT
                          </p>
                          <p className="font-black">
                            {order.shipment?.awb ||
                              order.shipment?.shipmentId ||
                              "Not created yet"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {order.address?.city || "City pending"},{" "}
                            {order.address?.pincode || "PIN pending"}
                          </p>
                          {order.address?.landmark && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Landmark: {order.address.landmark}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-2">
                            INVENTORY
                          </p>
                          {order.inventoryDeducted ? (
                            <p className="font-black text-green-400">
                              Deducted
                            </p>
                          ) : order.inventoryError ? (
                            <>
                              <p className="font-black text-red-400">
                                Error
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {order.inventoryError}
                              </p>
                            </>
                          ) : isPaid ? (
                            <p className="font-black text-yellow-400">
                              Pending
                            </p>
                          ) : (
                            <p className="font-black text-muted-foreground">
                              Waiting payment
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => updateStatus(order, "processing")}
                            disabled={updatingId === order.id || !isPaid}
                            className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary flex items-center gap-2 disabled:opacity-50"
                          >
                            <Clock3 className="w-4 h-4" />
                            Processing
                          </button>

                          <button
                            onClick={() => updateStatus(order, "shipped")}
                            disabled={updatingId === order.id || !isPaid || !hasShipment}
                            className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary flex items-center gap-2 disabled:opacity-50"
                          >
                            <Truck className="w-4 h-4" />
                            Shipped
                          </button>

                          <button
                            onClick={() => updateStatus(order, "in_transit")}
                            disabled={updatingId === order.id || !isPaid || !hasShipment}
                            className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary flex items-center gap-2 disabled:opacity-50"
                          >
                            <Package className="w-4 h-4" />
                            Transit
                          </button>

                          <button
                            onClick={() => updateStatus(order, "delivered")}
                            disabled={updatingId === order.id || !isPaid || !hasShipment}
                            className="px-4 py-3 bg-foreground text-background text-sm font-black hover:bg-foreground/90 flex items-center gap-2 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Delivered
                          </button>

                          <Link
                            href={`/invoice/${order.id}`}
                            className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary"
                          >
                            Invoice
                          </Link>

                          {order.payment?.gateway === "phonepe" && !isPaid && (
                            <button
                              type="button"
                              onClick={() => checkPaymentAndShipment(order)}
                              disabled={checkingPaymentId === order.id}
                              className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary disabled:opacity-50"
                            >
                              {checkingPaymentId === order.id
                                ? "Checking..."
                                : "Check Payment"}
                            </button>
                          )}

                          {order.payment?.gateway === "phonepe" && !isPaid && (
                            <button
                              type="button"
                              onClick={() => markPaidAfterVerification(order)}
                              disabled={markingPaidId === order.id}
                              className="px-4 py-3 border border-green-700 text-sm font-black text-green-400 hover:bg-secondary disabled:opacity-50"
                            >
                              {markingPaidId === order.id
                                ? "Marking..."
                                : "Mark Paid"}
                            </button>
                          )}

                          {isPaid && !order.inventoryDeducted && (
                            <button
                              type="button"
                              onClick={() => retryInventoryDeduction(order)}
                              disabled={deductingInventoryId === order.id}
                              className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary disabled:opacity-50 flex items-center gap-2"
                            >
                              <RefreshCcw className="w-4 h-4" />
                              {deductingInventoryId === order.id
                                ? "Deducting..."
                                : "Deduct Inventory"}
                            </button>
                          )}

                          {(order.shipment?.awb || order.shipment?.shipmentId) && (
                            <Link
                              href={`/tracking/${order.id}`}
                              className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary"
                            >
                              Track
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={() => cancelOrder(order)}
                            disabled={
                              cancellingId === order.id ||
                              order.status === "cancelled" ||
                              ["shipped", "in_transit", "delivered"].includes(
                                order.status || ""
                              )
                            }
                            className="px-4 py-3 border border-border text-sm font-black text-red-400 hover:bg-secondary disabled:opacity-50"
                          >
                            {order.status === "cancelled"
                              ? "Cancelled"
                              : cancellingId === order.id
                              ? "Cancelling..."
                              : "Cancel Now"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </main>

        <Footer />
      </>
    </ProtectedRoute>
  )
}
