"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle2, ChevronDown, Clock3, Package, RefreshCcw, Truck } from "lucide-react"
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

const getAdminStatusColor = (status = "pending") => {
  const normalizedStatus = status.toLowerCase()
  if (["paid", "success", "completed", "delivered"].includes(normalizedStatus)) {
    return "text-green-400"
  }
  if (normalizedStatus.includes("failed") || normalizedStatus === "cancelled") {
    return "text-red-400"
  }
  return "text-yellow-400"
}

const fulfillmentStages = ["paid", "processing", "shipped", "in_transit", "delivered"]

const getFulfillmentStage = (status = "paid") => {
  const index = fulfillmentStages.indexOf(status)
  return index >= 0 ? index : 0
}

const canMoveToStatus = (order: AdminOrder, nextStatus: string, isPaid: boolean) => {
  if (!isPaid || order.status === "cancelled" || order.status === "delivered") {
    return false
  }

  return fulfillmentStages.indexOf(nextStatus) === getFulfillmentStage(order.status) + 1
}

const canCancelOrder = (order: AdminOrder) =>
  !["cancelled", "shipped", "in_transit", "delivered"].includes(order.status || "")

const orderStatusFilters = [
  { label: "All orders", value: "all" },
  { label: "Paid", value: "paid" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "In Transit", value: "in_transit" },
  { label: "Delivered", value: "delivered" },
  { label: "Pending Payment", value: "pending_payment" },
  { label: "Cancelled", value: "cancelled" },
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [deductingInventoryId, setDeductingInventoryId] = useState<string | null>(null)
  const [syncingShipmentId, setSyncingShipmentId] = useState<string | null>(null)
  const [creatingShipmentId, setCreatingShipmentId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter)

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

    if (paymentStatus !== "success") {
      alert("Payment is not successful yet. Check payment status before updating this order.")
      return
    }

    if (!canMoveToStatus(order, status, true)) {
      alert("Please update order status step by step. Direct jumping is not allowed.")
      return
    }

    const orderId = order.id
    setUpdatingId(orderId)

    try {
      const now = new Date().toISOString()
      const statusFields: Record<string, string> = {
        status,
        updatedAt: now,
      }

      if (status === "shipped") statusFields.shippedAt = now
      if (status === "delivered") statusFields.deliveredAt = now

      await updateDoc(doc(db, "orders", orderId), statusFields)
      await fetchOrders()
    } catch (error) {
      console.error("ORDER STATUS UPDATE ERROR:", error)
      alert("Unable to update order status.")
    } finally {
      setUpdatingId(null)
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
      const response = await fetch("/api/razorpay/refund", {
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

  const syncShiprocketTracking = async (order: AdminOrder) => {
    if (!order.shipment?.awb && !order.shipment?.shipmentId) {
      alert("No Shiprocket AWB/shipment id found for this order yet.")
      return
    }

    setSyncingShipmentId(order.id)

    try {
      const response = await fetch(
        `/api/shiprocket/track?orderId=${encodeURIComponent(order.id)}`,
        {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
          },
        }
      )
      const data = await response.json()

      if (!response.ok || !data?.ok) {
        alert(data?.message || "Unable to sync Shiprocket tracking.")
        return
      }

      await fetchOrders()
      alert(`Shiprocket status synced: ${formatStatus(data.status || "updated")}`)
    } catch (error) {
      console.error("SHIPROCKET TRACKING SYNC ERROR:", error)
      alert("Unable to sync Shiprocket tracking.")
    } finally {
      setSyncingShipmentId(null)
    }
  }

  const createShiprocketOrder = async (order: AdminOrder) => {
    if (order.payment?.status !== "success") {
      alert("Payment is not successful yet.")
      return
    }

    setCreatingShipmentId(order.id)

    try {
      const response = await fetch("/api/shiprocket/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
        },
        body: JSON.stringify({
          orderId: order.id,
        }),
      })
      const data = await response.json()

      if (!response.ok || !data?.ok) {
        alert(data?.message || "Unable to create Shiprocket order.")
        return
      }

      await fetchOrders()
      alert("Shiprocket order created successfully.")
    } catch (error) {
      console.error("ADMIN SHIPROCKET CREATE ERROR:", error)
      alert("Unable to create Shiprocket order.")
    } finally {
      setCreatingShipmentId(null)
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
          Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
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

  return (
    <ProtectedRoute adminOnly>
      <>
        <Header />

        <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              ORDER CONTROL
            </p>

            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <h1 className="text-4xl font-black">ORDERS</h1>

              <label className="block w-full md:w-72">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-muted-foreground">
                  Filter orders
                </span>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="h-12 w-full appearance-none border border-border bg-background px-4 pr-11 text-sm font-black outline-none transition-colors hover:bg-secondary focus:border-foreground"
                  >
                    {orderStatusFilters.map((filter) => (
                      <option key={filter.value} value={filter.value}>
                        {filter.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </label>
            </div>

            <div className="space-y-6">
              {loading ? (
                <div className="border border-border bg-secondary/20 p-6 text-muted-foreground">
                  Loading orders...
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="border border-border bg-secondary/20 p-6 text-muted-foreground">
                  No {statusFilter === "all" ? "" : formatStatus(statusFilter).toLowerCase()} orders found.
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const firstItem = order.items?.[0]
                  const paymentStatus = order.payment?.status || "pending"
                  const isPaid = paymentStatus === "success"
                  const canSetProcessing = canMoveToStatus(order, "processing", isPaid)
                  const canSetShipped = canMoveToStatus(order, "shipped", isPaid)
                  const canSetTransit = canMoveToStatus(order, "in_transit", isPaid)
                  const canSetDelivered = canMoveToStatus(order, "delivered", isPaid)
                  const showCancel = canCancelOrder(order)
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
                          <p className={`font-black ${getAdminStatusColor(order.status)}`}>
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
                            disabled={updatingId === order.id || !canSetProcessing}
                            className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary flex items-center gap-2 disabled:opacity-50"
                          >
                            <Clock3 className="w-4 h-4" />
                            Processing
                          </button>

                          <button
                            onClick={() => updateStatus(order, "shipped")}
                            disabled={updatingId === order.id || !canSetShipped}
                            className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary flex items-center gap-2 disabled:opacity-50"
                          >
                            <Truck className="w-4 h-4" />
                            Shipped
                          </button>

                          <button
                            onClick={() => updateStatus(order, "in_transit")}
                            disabled={updatingId === order.id || !canSetTransit}
                            className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary flex items-center gap-2 disabled:opacity-50"
                          >
                            <Package className="w-4 h-4" />
                            Transit
                          </button>

                          <button
                            onClick={() => updateStatus(order, "delivered")}
                            disabled={updatingId === order.id || !canSetDelivered}
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
                            <>
                              <Link
                                href={`/tracking/${order.id}`}
                                className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary"
                              >
                                Track
                              </Link>
                              <button
                                type="button"
                                onClick={() => syncShiprocketTracking(order)}
                                disabled={syncingShipmentId === order.id}
                                className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary disabled:opacity-50"
                              >
                                {syncingShipmentId === order.id
                                  ? "Syncing..."
                                  : "Sync Shiprocket"}
                              </button>
                            </>
                          )}

                          {isPaid &&
                            !order.shipment?.awb &&
                            !order.shipment?.shipmentId && (
                              <button
                                type="button"
                                onClick={() => createShiprocketOrder(order)}
                                disabled={creatingShipmentId === order.id}
                                className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary disabled:opacity-50"
                              >
                                {creatingShipmentId === order.id
                                  ? "Creating..."
                                  : "Create Shiprocket"}
                              </button>
                            )}

                          {showCancel && (
                            <button
                              type="button"
                              onClick={() => cancelOrder(order)}
                              disabled={cancellingId === order.id}
                              className="px-4 py-3 border border-border text-sm font-black text-red-400 hover:bg-secondary disabled:opacity-50"
                            >
                              {cancellingId === order.id
                                ? "Cancelling..."
                                : "Cancel Now"}
                            </button>
                          )}
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
