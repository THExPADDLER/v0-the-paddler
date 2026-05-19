"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Clock3, Package, RotateCcw, Truck } from "lucide-react"
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useAuth } from "@/app/providers/AuthProvider"
import { db } from "@/lib/firebase"
import type { CartItem } from "@/lib/cart-context"

type CustomerOrder = {
  id: string
  invoiceNumber?: string
  items: CartItem[]
  pricing: {
    subtotal?: number
    shipping?: number
    couponDiscount?: number
    total: number
  }
  status: string
  payment?: {
    status?: string
    gateway?: string
  }
  shipment?: {
    awb?: string
    shipmentId?: string | number
    courierName?: string
    status?: string
  }
  trackingId?: string
  createdAt: string
  returnRequested?: boolean
}

const formatStatus = (status: string) => {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

const getStatusColor = (status: string) => {
  if (status === "paid" || status === "success") return "text-green-400"
  if (status.includes("failed")) return "text-red-400"
  return "text-yellow-400"
}

export default function OrdersPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [returningOrderId, setReturningOrderId] = useState<string | null>(null)
  const [checkingPaymentOrderId, setCheckingPaymentOrderId] = useState<string | null>(null)
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const autoCheckedPayments = useRef<Set<string>>(new Set())

  const fetchOrders = async () => {
    if (loading) return

    if (!user) {
      router.push("/login?redirect=/orders")
      return
    }

    try {
      setLoadingOrders(true)

      const ordersQuery = query(
        collection(db, "orders"),
        where("userId", "==", user.uid)
      )
      const snapshot = await getDocs(ordersQuery)
      const fetchedOrders = snapshot.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<CustomerOrder, "id">),
      }))

      fetchedOrders.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

      setOrders(fetchedOrders)
    } catch (error) {
      console.error("ORDERS FETCH ERROR:", error)
      alert("Unable to load orders.")
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [loading, user])

  useEffect(() => {
    const pendingPhonePeOrders = orders.filter(
      (order) =>
        order.payment?.gateway === "phonepe" &&
        order.payment?.status !== "success" &&
        order.payment?.status !== "failed" &&
        !autoCheckedPayments.current.has(order.id)
    )

    if (pendingPhonePeOrders.length === 0) return

    pendingPhonePeOrders.slice(0, 3).forEach((order) => {
      autoCheckedPayments.current.add(order.id)

      fetch(`/api/phonepe/status?orderId=${encodeURIComponent(order.id)}`, {
        cache: "no-store",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data?.paymentStatus === "success" || data?.paymentStatus === "failed") {
            fetchOrders()
          }
        })
        .catch((error) => {
          console.error("ORDER AUTO PAYMENT CHECK ERROR:", error)
        })
    })
  }, [orders])

  const checkPaymentStatus = async (order: CustomerOrder) => {
    setCheckingPaymentOrderId(order.id)

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
        console.error("PAYMENT STATUS REFRESH ERROR:", data)
        alert(data?.message || "Unable to refresh payment status.")
        return
      }

      await fetchOrders()

      if (data.paymentStatus === "success") {
        alert(
          data.shipmentError
            ? `Payment is successful, but Shiprocket needs attention: ${data.shipmentError}`
            : "Payment confirmed. Shipment creation has been triggered."
        )
        return
      }

      if (data.needsManualVerification) {
        alert(
          "PhonePe could not return a readable status to the website. If money is deducted, our team will verify it in the PhonePe dashboard and confirm the order."
        )
        return
      }

      alert(`Current payment status: ${formatStatus(data.paymentStatus || "pending")}`)
    } catch (error) {
      console.error("PAYMENT STATUS REFRESH ERROR:", error)
      alert("Unable to refresh payment status.")
    } finally {
      setCheckingPaymentOrderId(null)
    }
  }

  const requestReturn = async (order: CustomerOrder) => {
    if (!user) return

    if (order.payment?.status !== "success") {
      alert("Return can be requested only after successful payment.")
      return
    }

    if (order.returnRequested || order.status === "return_requested") {
      alert("Return request already submitted for this order.")
      return
    }

    if (order.status !== "delivered") {
      alert("Return can be requested only after the order is delivered.")
      return
    }

    const confirmed = window.confirm(
      "Request return for this order? Our team will review it and contact you."
    )

    if (!confirmed) return

    setReturningOrderId(order.id)

    try {
      const response = await fetch("/api/shiprocket/return", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          userId: user.uid,
          customerEmail: user.email || "",
          reason: "Customer requested return from orders page",
        }),
      })
      const data = await response.json()

      if (!response.ok || !data?.ok) {
        alert(data?.message || "Unable to request return.")
        return
      }

      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id
            ? { ...item, status: "return_requested", returnRequested: true }
            : item
        )
      )

      alert(data.message || "Return request submitted successfully.")
    } catch (error) {
      console.error("RETURN REQUEST ERROR:", error)
      alert("Unable to request return. Please try again.")
    } finally {
      setReturningOrderId(null)
    }
  }

  const cancelOrder = async (order: CustomerOrder) => {
    if (!user) {
      router.push("/login?redirect=/orders")
      return
    }

    if (order.status === "cancelled") {
      alert("This order is already cancelled.")
      return
    }

    if (order.status === "delivered") {
      alert("Delivered orders cannot be cancelled. Please use return.")
      return
    }

    if (["shipped", "in_transit"].includes(order.status)) {
      alert(
        "This order has already been shipped and cannot be cancelled. It will be delivered to your address. You can request a return after delivery."
      )
      return
    }

    const confirmed = window.confirm(
      order.payment?.status === "success"
        ? "Cancel this order and initiate refund to original payment account?"
        : "Cancel this order?"
    )

    if (!confirmed) return

    setCancellingOrderId(order.id)

    try {
      const response = await fetch("/api/phonepe/refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user?.getIdToken()}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          reason: "Customer cancelled from orders page",
          cancelledBy: "customer",
        }),
      })
      const data = await response.json()

      await fetchOrders()
      alert(data?.message || "Cancellation request completed.")
    } catch (error) {
      console.error("ORDER CANCEL ERROR:", error)
      alert("Unable to cancel order.")
    } finally {
      setCancellingOrderId(null)
    }
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-background text-foreground pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              CUSTOMER DASHBOARD
            </p>

            <h1 className="text-3xl font-black">
              MY ORDERS
            </h1>
          </div>

          {loadingOrders ? (
            <div className="border border-border bg-secondary/20 py-24 text-center">
              <p className="text-muted-foreground">Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="border border-border bg-secondary/20 py-24 text-center">
              <Package className="w-14 h-14 mx-auto text-muted-foreground mb-6" />

              <h2 className="text-2xl font-bold mb-3">
                NO ORDERS YET
              </h2>

              <p className="text-muted-foreground mb-8">
                Your future drops will appear here.
              </p>

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3 text-sm font-bold hover:bg-foreground/90 transition-colors"
              >
                SHOP NOW
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {orders.map((order) => {
                const firstItem = order.items[0]
                const orderedDate = new Date(order.createdAt).toLocaleDateString(
                  "en-IN",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                )

                return (
                  <div
                    key={order.id}
                    className="border border-border bg-secondary/20 overflow-hidden"
                  >
                    <div className="border-b border-border px-6 py-4 grid sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">ORDER ID</p>
                        <p className="font-bold break-all">#{order.id}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Invoice:{" "}
                          <span className="text-foreground font-bold">
                            {order.invoiceNumber || order.id}
                          </span>
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">ORDERED ON</p>
                        <p className="font-medium">{orderedDate}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">STATUS</p>
                        <p className={`font-medium ${getStatusColor(order.status)}`}>
                          {formatStatus(order.status)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">PAYMENT</p>
                        <p className={`font-medium ${getStatusColor(order.payment?.status || "pending")}`}>
                          {formatStatus(order.payment?.status || "pending")}
                        </p>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex gap-5 flex-1">
                          {firstItem && (
                            <div className="relative w-28 h-32 bg-neutral-900 overflow-hidden flex-shrink-0">
                              <Image
                                src={firstItem.image}
                                alt={firstItem.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}

                          <div>
                            <h2 className="font-black text-lg">
                              {firstItem?.name || "Order items"}
                            </h2>

                            <p className="text-sm text-muted-foreground mt-1">
                              {order.items.length} item{order.items.length === 1 ? "" : "s"}
                            </p>

                            {firstItem && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Size: {firstItem.size} / Qty: {firstItem.quantity}
                              </p>
                            )}

                            <p className="font-bold mt-4">
                              ₹{order.pricing.total}
                            </p>
                          </div>
                        </div>

                        <div className="lg:w-[420px]">
                          <h3 className="font-bold mb-6">TRACK ORDER</h3>

                          <div className="space-y-6">
                            <div className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                <div className="w-px h-10 bg-border mt-2" />
                              </div>

                              <div>
                                <p className="font-medium">Order Placed</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Your order has been placed.
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <Clock3 className="w-5 h-5 text-yellow-400" />
                                <div className="w-px h-10 bg-border mt-2" />
                              </div>

                              <div>
                                <p className={`font-medium ${getStatusColor(order.payment?.status || "pending")}`}>
                                  {order.payment?.status === "success"
                                    ? "Payment Successful"
                                    : order.payment?.status === "failed"
                                    ? "Payment Failed"
                                    : "Payment Pending"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {order.payment?.status === "success"
                                    ? "Payment has been confirmed by PhonePe."
                                    : order.payment?.status === "failed"
                                    ? "Payment failed. Please contact support or try again."
                                    : "Waiting for PhonePe confirmation."}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-4 opacity-40">
                              <div className="flex flex-col items-center">
                                <Truck className="w-5 h-5" />
                                <div className="w-px h-10 bg-border mt-2" />
                              </div>

                              <div>
                                <p className="font-medium">Shipped</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {order.shipment?.awb
                                    ? `AWB: ${order.shipment.awb}`
                                    : "Awaiting shipment creation."}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-4 opacity-40">
                              <div className="flex flex-col items-center">
                                <Package className="w-5 h-5" />
                              </div>

                              <div>
                                <p className="font-medium">Delivered</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Awaiting dispatch.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 mt-8">
                            <Link
                              href={`/invoice/${order.id}`}
                              className="px-5 py-3 border border-border text-sm font-bold hover:bg-secondary"
                            >
                              DOWNLOAD INVOICE
                            </Link>

                            {(order.shipment?.awb || order.trackingId) && (
                              <Link
                                href={`/tracking/${order.id}`}
                                className="px-5 py-3 border border-border text-sm font-bold hover:bg-secondary"
                              >
                                TRACK SHIPMENT
                              </Link>
                            )}

                            {order.payment?.gateway === "phonepe" &&
                              order.payment?.status !== "success" && (
                                <button
                                  type="button"
                                  onClick={() => checkPaymentStatus(order)}
                                  disabled={checkingPaymentOrderId === order.id}
                                  className="px-5 py-3 border border-border text-sm font-bold hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {checkingPaymentOrderId === order.id
                                    ? "CHECKING..."
                                    : "CHECK PAYMENT STATUS"}
                                </button>
                              )}

                            <button
                              type="button"
                              onClick={() => requestReturn(order)}
                              disabled={
                                returningOrderId === order.id ||
                                order.payment?.status !== "success" ||
                                order.returnRequested ||
                                order.status === "return_requested" ||
                                order.status !== "delivered"
                              }
                              className="px-5 py-3 border border-border text-sm font-bold hover:bg-secondary transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <RotateCcw className="w-4 h-4" />
                              {order.returnRequested ||
                              order.status === "return_requested"
                                ? "RETURN REQUESTED"
                                : returningOrderId === order.id
                                ? "REQUESTING..."
                                : "RETURN"}
                            </button>

                            <button
                              type="button"
                              onClick={() => cancelOrder(order)}
                              disabled={
                                cancellingOrderId === order.id ||
                                order.status === "cancelled" ||
                                ["shipped", "in_transit", "delivered"].includes(
                                  order.status
                                )
                              }
                              className="px-5 py-3 border border-border text-sm font-bold text-red-400 hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {order.status === "cancelled"
                                ? "CANCELLED"
                                : cancellingOrderId === order.id
                                ? "CANCELLING..."
                                : "CANCEL NOW"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
