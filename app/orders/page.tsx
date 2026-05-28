"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Clock3, Package, RotateCcw, Truck, XCircle } from "lucide-react"
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useAuth } from "@/app/providers/AuthProvider"
import { db, storage } from "@/lib/firebase"
import type { CartItem } from "@/lib/cart-context"

const returnReasons = [
  "Size issue",
  "Wrong product received",
  "Damaged product received",
  "Quality issue",
  "Other",
]

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
  customer?: {
    name?: string
    email?: string
    phone?: string
  }
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
  updatedAt?: string
  deliveredAt?: string
  returnRequested?: boolean
}

type RazorpayCheckoutResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

type RazorpayFailedResponse = {
  error?: {
    description?: string
    reason?: string
  }
}

type RazorpayOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill: {
    name: string
    email: string
    contact: string
  }
  notes: Record<string, string>
  theme: {
    color: string
  }
  modal: {
    ondismiss: () => void
  }
  handler: (response: RazorpayCheckoutResponse) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void
      on: (
        event: "payment.failed",
        handler: (response: RazorpayFailedResponse) => void
      ) => void
    }
  }
}

const loadRazorpayCheckout = () => {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const formatStatus = (status: string) => {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

const getStatusColor = (status: string) => {
  if (status === "paid" || status === "success" || status === "completed") return "text-green-400"
  if (status.includes("failed") || status === "cancelled") return "text-red-400"
  return "text-yellow-400"
}

const isOrderShipped = (order: CustomerOrder) => {
  return Boolean(
    order.shipment?.awb ||
      ["shipped", "in_transit", "delivered"].includes(order.status)
  )
}

const getConnectorFill = (currentComplete: boolean, nextComplete: boolean) => {
  if (nextComplete) return "h-full"
  if (currentComplete) return "h-1/2"
  return "h-0"
}

const isReturnWindowOpen = (order: CustomerOrder) => {
  if (order.status !== "delivered") return false

  const deliveredAt = order.deliveredAt || order.updatedAt
  if (!deliveredAt) return true

  const deliveredDate = new Date(deliveredAt)
  if (Number.isNaN(deliveredDate.getTime())) return true

  const windowEndsAt = new Date(deliveredDate)
  windowEndsAt.setDate(windowEndsAt.getDate() + 3)

  return Date.now() <= windowEndsAt.getTime()
}

export default function OrdersPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [returningOrderId, setReturningOrderId] = useState<string | null>(null)
  const [returnFormOrderId, setReturnFormOrderId] = useState<string | null>(null)
  const [returnReason, setReturnReason] = useState("Size issue")
  const [returnDescription, setReturnDescription] = useState("")
  const [returnImage, setReturnImage] = useState<File | null>(null)
  const [retryingPaymentOrderId, setRetryingPaymentOrderId] = useState<string | null>(null)
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const autoSyncedShipments = useRef<Set<string>>(new Set())

  const fetchOrders = useCallback(async () => {
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
  }, [loading, router, user])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    const trackableOrders = orders.filter(
      (order) =>
        order.payment?.status === "success" &&
        Boolean(order.shipment?.awb || order.trackingId) &&
        !autoSyncedShipments.current.has(order.id)
    )

    if (trackableOrders.length === 0) return

    trackableOrders.slice(0, 3).forEach((order) => {
      autoSyncedShipments.current.add(order.id)

      user
        ?.getIdToken()
        .then((token) =>
          fetch(`/api/shiprocket/track?orderId=${encodeURIComponent(order.id)}`, {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
        .then((response) => response?.json())
        .then((data) => {
          if (data?.ok) {
            fetchOrders()
          }
        })
        .catch((error) => {
          console.error("ORDER AUTO SHIPROCKET SYNC ERROR:", error)
        })
    })
  }, [fetchOrders, orders, user])

  const retryRazorpayPayment = async (order: CustomerOrder) => {
    if (!user) {
      router.push("/login?redirect=/orders")
      return
    }

    if (order.payment?.status === "success") {
      alert("Payment is already successful for this order.")
      return
    }

    if (order.status === "cancelled") {
      alert("Cancelled orders cannot be paid again. Please place a new order.")
      return
    }

    setRetryingPaymentOrderId(order.id)

    try {
      const createResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          amount: order.pricing.total,
          customer: {
            email: user.email || "",
          },
        }),
      })
      const createData = await createResponse.json()

      if (!createResponse.ok || !createData?.razorpayOrderId || !createData?.keyId) {
        alert(createData?.message || "Unable to restart payment.")
        setRetryingPaymentOrderId(null)
        return
      }

      const loaded = await loadRazorpayCheckout()

      if (!loaded || !window.Razorpay) {
        alert("Razorpay checkout could not load. Please try again.")
        setRetryingPaymentOrderId(null)
        return
      }

      const checkout = new window.Razorpay({
        key: createData.keyId,
        amount: createData.amount,
        currency: createData.currency || "INR",
        name: "THE PADDLER",
        description: `Order #${order.id}`,
        order_id: createData.razorpayOrderId,
        prefill: {
          name: user.displayName || order.customer?.name || "",
          email: user.email || order.customer?.email || "",
          contact: order.customer?.phone || "",
        },
        notes: {
          orderId: order.id,
          invoiceNumber: order.invoiceNumber || "",
        },
        theme: {
          color: "#000000",
        },
        modal: {
          ondismiss: () => {
            setRetryingPaymentOrderId(null)
            fetchOrders()
          },
        },
        handler: async (paymentResponse) => {
          try {
            const verifyResponse = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                orderId: order.id,
                ...paymentResponse,
              }),
            })
            const verifyData = await verifyResponse.json()

            if (!verifyResponse.ok || !verifyData?.ok) {
              alert(
                verifyData?.message ||
                  "Payment received, but verification failed. Please contact support."
              )
              return
            }

            await fetchOrders()
            router.push(`/thank-you?orderId=${encodeURIComponent(order.id)}`)
          } catch (error) {
            console.error("RAZORPAY RETRY VERIFY ERROR:", error)
            alert("Payment verification failed. Please contact support.")
          } finally {
            setRetryingPaymentOrderId(null)
          }
        },
      })

      checkout.on("payment.failed", async (response) => {
        await updateDoc(doc(db, "orders", order.id), {
          status: "payment_failed",
          "payment.status": "failed",
          "payment.failureReason":
            response.error?.description || response.error?.reason || null,
          updatedAt: new Date().toISOString(),
        })
        setRetryingPaymentOrderId(null)
        await fetchOrders()
      })

      checkout.open()
    } catch (error) {
      console.error("RAZORPAY RETRY ERROR:", error)
      alert("Unable to retry payment.")
      setRetryingPaymentOrderId(null)
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

    if (!isReturnWindowOpen(order)) {
      alert("Returns and replacements are accepted only within 3 days of delivery.")
      return
    }

    if (returnReason !== "Size issue") {
      alert("Returns and replacements are currently accepted only for size issues.")
      return
    }

    if (returnDescription.trim().length < 10) {
      alert("Please enter a short return description.")
      return
    }

    setReturningOrderId(order.id)

    try {
      let imageUrl = ""

      if (returnImage) {
        const extension = returnImage.name.split(".").pop() || "jpg"
        const imageRef = ref(
          storage,
          `returns/${order.id}-${Date.now()}.${extension}`
        )
        await uploadBytes(imageRef, returnImage)
        imageUrl = await getDownloadURL(imageRef)
      }

      const response = await fetch("/api/shiprocket/return", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          userId: user.uid,
          customerEmail: user.email || "",
          reason: returnReason,
          description: returnDescription.trim(),
          imageUrl,
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
      setReturnFormOrderId(null)
      setReturnReason("Size issue")
      setReturnDescription("")
      setReturnImage(null)

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
      const response = await fetch("/api/razorpay/refund", {
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

      <main className="orders-stage min-h-screen bg-background text-foreground pt-24 pb-16">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                const paymentStatus = order.payment?.status || "pending"
                const paymentComplete = paymentStatus === "success"
                const paymentFailed = paymentStatus === "failed"
                const shipped = isOrderShipped(order)
                const delivered = order.status === "delivered"
                const returnRequested =
                  order.returnRequested || order.status === "return_requested"
                const canCancel =
                  ![
                    "cancelled",
                    "shipped",
                    "in_transit",
                    "delivered",
                    "return_requested",
                  ].includes(order.status)
                const showReturn = delivered || returnRequested
                const returnWindowOpen = isReturnWindowOpen(order)
                const timelineSteps =
                  order.status === "cancelled"
                    ? [
                        {
                          title: "Order Placed",
                          message: "Your order was placed.",
                          complete: true,
                          failed: false,
                          icon: CheckCircle2,
                        },
                        {
                          title: "Order Cancelled",
                          message: "This order has been cancelled.",
                          complete: true,
                          failed: true,
                          icon: XCircle,
                        },
                      ]
                    : [
                        {
                          title: "Order Placed",
                          message: "Your order has been placed.",
                          complete: true,
                          failed: false,
                          icon: CheckCircle2,
                        },
                        {
                          title: paymentComplete
                            ? "Payment Successful"
                            : paymentFailed
                            ? "Payment Failed"
                            : "Payment Pending",
                          message: paymentComplete
                            ? "Payment has been confirmed."
                            : paymentFailed
                            ? "Payment failed. Please contact support or try again."
                            : "Waiting for payment confirmation.",
                          complete: paymentComplete,
                          failed: paymentFailed,
                          icon: paymentComplete ? CheckCircle2 : Clock3,
                        },
                        {
                          title: shipped ? "Shipped" : "Shipment Pending",
                          message: order.shipment?.awb
                            ? `AWB: ${order.shipment.awb}`
                            : "Awaiting shipment creation.",
                          complete: shipped,
                          failed: false,
                          icon: Truck,
                        },
                        {
                          title: delivered ? "Delivered" : "Delivery Pending",
                          message: delivered
                            ? "Your order has been delivered."
                            : "Awaiting dispatch.",
                          complete: delivered,
                          failed: false,
                          icon: Package,
                        },
                      ]

                return (
                  <div
                    key={order.id}
                    className="order-card group relative overflow-hidden border border-white/10 bg-black/70 shadow-[0_28px_90px_rgba(0,0,0,0.35)]"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.08)_45%,transparent_58%)] opacity-0 transition duration-700 group-hover:translate-x-16 group-hover:opacity-100" />

                    <div className="relative border-b border-white/10 px-6 py-5 grid sm:grid-cols-4 gap-4 bg-white/[0.02]">
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

                    <div className="relative p-6">
                      <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex gap-5 flex-1">
                          {firstItem && (
                            <div className="relative w-28 h-32 bg-neutral-900 overflow-hidden flex-shrink-0 border border-white/10 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
                              <Image
                                src={firstItem.image}
                                alt={firstItem.name}
                                fill
                                className="object-cover transition duration-500 group-hover:scale-110"
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

                          <div className="order-timeline-panel space-y-0 border border-white/10 bg-white/[0.025] p-5">
                            {timelineSteps.map((step, index) => {
                              const Icon = step.icon
                              const nextStep = timelineSteps[index + 1]
                              const isLast = index === timelineSteps.length - 1
                              const isWaiting =
                                !step.complete &&
                                !step.failed &&
                                timelineSteps
                                  .slice(0, index)
                                  .every((item) => item.complete)

                              return (
                                <div
                                  key={step.title}
                                  className="grid grid-cols-[34px_1fr] gap-4"
                                >
                                  <div className="flex flex-col items-center">
                                    <div
                                      className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-700 ${
                                        step.failed
                                          ? "border-red-400 bg-red-500/10 text-red-400"
                                          : step.complete
                                          ? "border-green-400 bg-green-500/15 text-green-400 shadow-[0_0_18px_rgba(34,197,94,0.35)] animate-timeline-pop"
                                          : isWaiting
                                          ? "border-yellow-400 bg-yellow-400/10 text-yellow-400 animate-timeline-wait"
                                          : "border-border bg-background text-muted-foreground"
                                      }`}
                                    >
                                      <Icon className="h-4 w-4" />
                                    </div>

                                    {!isLast && (
                                      <div className="relative my-2 h-14 w-px overflow-hidden bg-border">
                                        <div
                                          className={`absolute left-0 top-0 w-px transition-all duration-1000 ease-out ${
                                            nextStep?.failed
                                              ? "bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.7)]"
                                              : "bg-green-400 shadow-[0_0_12px_rgba(34,197,94,0.7)]"
                                          } ${getConnectorFill(
                                            step.complete,
                                            Boolean(nextStep?.complete)
                                          )}`}
                                        />
                                      </div>
                                    )}
                                  </div>

                                  <div
                                    className={`pb-6 transition-all duration-500 ${
                                      step.complete
                                        ? "opacity-100 translate-x-0"
                                        : isWaiting
                                        ? "opacity-100 translate-x-0"
                                        : "opacity-45"
                                    }`}
                                  >
                                    <p
                                      className={`font-medium ${
                                        step.failed
                                          ? "text-red-400"
                                          : step.complete
                                          ? "text-green-400"
                                          : isWaiting
                                          ? "text-yellow-400"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      {step.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {step.message}
                                    </p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          <div className="flex flex-wrap gap-3 mt-8">
                            <Link
                              href={`/invoice/${order.id}`}
                              className="px-5 py-3 border border-white/15 text-sm font-bold hover:bg-white/10"
                            >
                              DOWNLOAD INVOICE
                            </Link>

                            {(order.shipment?.awb || order.trackingId) && (
                              <Link
                                href={`/tracking/${order.id}`}
                                className="px-5 py-3 border border-white/15 text-sm font-bold hover:bg-white/10"
                              >
                                TRACK SHIPMENT
                              </Link>
                            )}

                            {order.payment?.gateway === "razorpay" &&
                              order.payment?.status !== "success" &&
                              order.status !== "cancelled" && (
                                <button
                                  type="button"
                                  onClick={() => retryRazorpayPayment(order)}
                                  disabled={retryingPaymentOrderId === order.id}
                                  className="px-5 py-3 bg-foreground text-background text-sm font-bold hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {retryingPaymentOrderId === order.id
                                    ? "OPENING PAYMENT..."
                                    : "RETRY PAYMENT"}
                                </button>
                              )}

                            {showReturn && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReturnFormOrderId((current) =>
                                      current === order.id ? null : order.id
                                    )
                                    setReturnReason("Size issue")
                                    setReturnDescription("")
                                    setReturnImage(null)
                                  }}
                                  disabled={
                                    returningOrderId === order.id ||
                                    order.payment?.status !== "success" ||
                                    returnRequested ||
                                    !delivered ||
                                    !returnWindowOpen
                                  }
                                  className="px-5 py-3 border border-white/15 text-sm font-bold hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  {returnRequested
                                    ? "RETURN REQUESTED"
                                    : returningOrderId === order.id
                                    ? "REQUESTING..."
                                    : returnWindowOpen
                                    ? "RETURN"
                                    : "RETURN CLOSED"}
                                </button>

                                {returnFormOrderId === order.id && (
                                  <div className="w-full border border-white/15 bg-background/70 p-4">
                                    <p className="text-sm font-black">
                                      RETURN REQUEST
                                    </p>
                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                      Returns are accepted only for size issues within 3 days of delivery. Product must be unused, unwashed, and in original packaging.
                                    </p>

                                    <div className="mt-4 grid gap-3">
                                      <select
                                        value={returnReason}
                                        onChange={(event) =>
                                          setReturnReason(event.target.value)
                                        }
                                        className="w-full border border-border bg-background px-4 py-3 text-sm outline-none"
                                      >
                                        {returnReasons.map((reason) => (
                                          <option key={reason} value={reason}>
                                            {reason}
                                          </option>
                                        ))}
                                      </select>

                                      <div>
                                        <textarea
                                          value={returnDescription}
                                          maxLength={1000}
                                          onChange={(event) =>
                                            setReturnDescription(event.target.value)
                                          }
                                          placeholder="Describe your return request"
                                          className="min-h-32 w-full resize-none border border-border bg-background px-4 py-3 text-sm outline-none"
                                        />
                                        <p className="mt-1 text-right text-xs text-muted-foreground">
                                          {returnDescription.length}/1000
                                        </p>
                                      </div>

                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) =>
                                          setReturnImage(event.target.files?.[0] || null)
                                        }
                                        className="w-full border border-border bg-background px-4 py-3 text-sm"
                                      />

                                      <div className="flex flex-wrap gap-3">
                                        <button
                                          type="button"
                                          onClick={() => requestReturn(order)}
                                          disabled={returningOrderId === order.id}
                                          className="bg-foreground px-5 py-3 text-sm font-black text-background disabled:opacity-50"
                                        >
                                          {returningOrderId === order.id
                                            ? "SUBMITTING..."
                                            : "SUBMIT RETURN"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setReturnFormOrderId(null)}
                                          className="border border-border px-5 py-3 text-sm font-black"
                                        >
                                          CANCEL
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            {canCancel && (
                              <button
                                type="button"
                                onClick={() => cancelOrder(order)}
                                disabled={cancellingOrderId === order.id}
                                className="px-5 py-3 border border-red-500/30 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {cancellingOrderId === order.id
                                  ? "CANCELLING..."
                                  : "CANCEL NOW"}
                              </button>
                            )}
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
