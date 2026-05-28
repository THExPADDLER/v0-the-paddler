"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"

import { useAuth } from "@/app/providers/AuthProvider"
import { db } from "@/lib/firebase"
import type { CartItem } from "@/lib/cart-context"

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)

type InvoiceOrder = {
  id: string
  invoiceNumber?: string
  userId: string
  customer?: {
    name?: string
    email?: string
    phone?: string
  }
  address?: {
    fullName: string
    phone: string
    address: string
    landmark?: string
    city: string
    state: string
    pincode: string
  }
  items: CartItem[]
  pricing: {
    subtotal?: number
    shipping?: number
    couponDiscount?: number
    total: number
  }
  payment?: {
    status?: string
    gateway?: string
  }
  createdAt: string
}

export default function InvoicePage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [order, setOrder] = useState<InvoiceOrder | null>(null)
  const [loadingOrder, setLoadingOrder] = useState(true)

  const orderId = params.orderId as string

  useEffect(() => {
    const fetchOrder = async () => {
      if (loading) return

      if (!user) {
        router.push(`/login?redirect=/invoice/${orderId}`)
        return
      }

      try {
        setLoadingOrder(true)

        const orderSnap = await getDoc(doc(db, "orders", orderId))

        if (!orderSnap.exists()) {
          setOrder(null)
          return
        }

        const orderData = {
          id: orderSnap.id,
          ...(orderSnap.data() as Omit<InvoiceOrder, "id">),
        }

        if (orderData.userId !== user.uid) {
          setOrder(null)
          return
        }

        setOrder(orderData)
      } catch (error) {
        console.error("INVOICE FETCH ERROR:", error)
        setOrder(null)
      } finally {
        setLoadingOrder(false)
      }
    }

    fetchOrder()
  }, [loading, orderId, router, user])

  if (loadingOrder) {
    return (
      <main className="min-h-screen bg-white text-black flex items-center justify-center">
        Loading invoice...
      </main>
    )
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-white text-black flex items-center justify-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-black mb-4">Invoice Not Found</h1>
          <Link href="/orders" className="underline">
            Back to orders
          </Link>
        </div>
      </main>
    )
  }

  const orderedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const subtotal =
    order.pricing.subtotal ||
    order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = order.pricing.shipping || 0
  const couponDiscount = order.pricing.couponDiscount || 0
  const paymentStatus = order.payment?.status || "pending"
  const paymentLabel =
    paymentStatus.toLowerCase() === "success" || paymentStatus.toLowerCase() === "paid"
      ? "Paid"
      : paymentStatus
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <main className="min-h-screen bg-[#f1f1ee] text-black py-10 px-4 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8 print:hidden">
          <Link href="/orders" className="text-sm font-black underline underline-offset-4">
            Back to orders
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="bg-black text-white px-6 py-3 font-black tracking-wide hover:bg-neutral-800 transition-colors"
          >
            DOWNLOAD / SAVE PDF
          </button>
        </div>

        <section className="relative overflow-hidden bg-white shadow-2xl shadow-black/10 print:shadow-none">
          <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,#000,#d7de37,#000)]" />
          <div className="relative bg-black text-white px-6 sm:px-10 pt-10 pb-12">
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(135deg,transparent_0,transparent_46%,rgba(255,255,255,.22)_47%,transparent_48%,transparent_100%)] bg-[length:34px_34px]" />
            <div className="relative flex flex-col items-center text-center">
              <div className="relative h-28 w-72 sm:h-32 sm:w-96">
                <Image
                  src="/images/paddler-logo-removedbg.png"
                  alt="THE PADDLER"
                  fill
                  priority
                  className="object-contain"
                />
              </div>
              <p className="mt-2 text-[11px] uppercase tracking-[0.45em] text-neutral-300">
                Premium Streetwear Invoice
              </p>
            </div>
          </div>

          <div className="px-6 sm:px-10 -mt-7 relative z-10">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="bg-white border border-neutral-200 p-4 shadow-lg shadow-black/5 sm:col-span-2">
                <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  Invoice No.
                </p>
                <h1 className="mt-2 text-xl sm:text-2xl font-black break-all">
                  {order.invoiceNumber || order.id}
                </h1>
              </div>
              <div className="bg-[#d7de37] p-4 shadow-lg shadow-black/5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-black/60">
                  Total Paid
                </p>
                <p className="mt-2 text-2xl font-black">{formatCurrency(order.pricing.total)}</p>
              </div>
              <div className="bg-white border border-neutral-200 p-4 shadow-lg shadow-black/5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  Payment
                </p>
                <p
                  className={`mt-3 inline-flex px-3 py-1 text-xs font-black uppercase tracking-wider ${
                    paymentLabel.toLowerCase() === "paid"
                      ? "bg-emerald-500 text-black"
                      : "bg-yellow-300 text-black"
                  }`}
                >
                  {paymentLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 sm:px-10 py-8">
            <div className="grid sm:grid-cols-3 gap-4 mb-8 text-sm">
              <div className="border border-neutral-200 p-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-500">
                  Order ID
                </p>
                <p className="mt-2 font-bold break-all">#{order.id}</p>
              </div>
              <div className="border border-neutral-200 p-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-500">
                  Invoice Date
                </p>
                <p className="mt-2 font-bold">{orderedDate}</p>
              </div>
              <div className="border border-neutral-200 p-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-500">
                  Items
                </p>
                <p className="mt-2 font-bold">
                  {itemCount} {itemCount === 1 ? "piece" : "pieces"}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 pb-8 border-b border-neutral-200">
              <div className="bg-neutral-50 border border-neutral-200 p-5">
                <h3 className="text-sm font-black uppercase tracking-[0.22em] mb-4">
                  Bill To
                </h3>
                <div className="space-y-1 text-sm text-neutral-700">
                  <p className="text-base text-black font-black">
                    {order.customer?.name || order.address?.fullName}
                  </p>
                  <p>{order.customer?.email || "Email not available"}</p>
                  <p>{order.customer?.phone || order.address?.phone}</p>
                </div>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 p-5">
                <h3 className="text-sm font-black uppercase tracking-[0.22em] mb-4">
                  Ship To
                </h3>
                {order.address && (
                  <div className="space-y-1 text-sm text-neutral-700">
                    <p className="text-base text-black font-black">{order.address.fullName}</p>
                    <p>{order.address.address}</p>
                    {order.address.landmark && <p>Landmark: {order.address.landmark}</p>}
                    <p>
                      {order.address.city}, {order.address.state} - {order.address.pincode}
                    </p>
                    <p>{order.address.phone}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="py-8 border-b border-neutral-200">
              <div className="hidden sm:grid grid-cols-[1fr_80px_120px_130px] gap-4 text-xs font-black uppercase tracking-[0.22em] bg-black text-white px-4 py-4">
                <span>Item</span>
                <span>Qty</span>
                <span>Price</span>
                <span className="text-right">Total</span>
              </div>

              {order.items.map((item) => (
                <div
                  key={`${item.id}-${item.size}`}
                  className="grid sm:grid-cols-[1fr_80px_120px_130px] gap-4 items-center py-5 border-b border-neutral-200 last:border-b-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-24 bg-neutral-100 border border-neutral-200 shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="font-black uppercase">{item.name}</p>
                      <p className="text-sm text-neutral-600">Size: {item.size}</p>
                    </div>
                  </div>
                  <span className="font-bold">
                    <span className="sm:hidden text-neutral-500 font-normal">Qty: </span>
                    {item.quantity}
                  </span>
                  <span className="font-bold">
                    <span className="sm:hidden text-neutral-500 font-normal">Price: </span>
                    {formatCurrency(item.price)}
                  </span>
                  <span className="text-left sm:text-right font-black">
                    <span className="sm:hidden text-neutral-500 font-normal">Total: </span>
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-[1fr_360px] gap-8 py-8">
              <div className="border border-neutral-200 p-5 bg-[linear-gradient(135deg,#f7f7f7,#ffffff)]">
                <h3 className="text-sm font-black uppercase tracking-[0.22em] mb-3">Note</h3>
                <p className="text-sm leading-6 text-neutral-600">
                  Thank you for choosing THE PADDLER. Keep this invoice for warranty, return,
                  and payment reference.
                </p>
                <p className="mt-4 text-xs uppercase tracking-[0.24em] text-neutral-500">
                  Not just clothing. A statement.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Subtotal</span>
                  <span className="font-bold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Shipping</span>
                  <span className="font-bold">
                    {shipping === 0 ? "FREE" : formatCurrency(shipping)}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-700">
                    <span>Coupon Discount</span>
                    <span className="font-bold">-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t-2 border-black pt-4 text-2xl font-black">
                  <span>Total</span>
                  <span>{formatCurrency(order.pricing.total)}</span>
                </div>
              </div>
            </div>

            <div className="bg-black text-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">Support</p>
                <p className="mt-1 font-bold">
                  For order support, contact THE PADDLER with your invoice number.
                </p>
              </div>
              <div className="text-left sm:text-right text-sm text-neutral-300">
                <p>www.thepaddler.in</p>
                <p>{order.customer?.email}</p>
              </div>
            </div>
          </div>
        </section>

        <style jsx global>{`
          @media print {
            @page {
              margin: 12mm;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            a[href]:after {
              content: "";
            }
          }
        `}</style>
      </div>
    </main>
  )
}
