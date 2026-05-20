"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Lock, MapPin, Tag, Truck } from "lucide-react"
import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/app/providers/AuthProvider"
import { db } from "@/lib/firebase"
import { createInventoryKey, emptySizeStock, type SizeStock } from "@/lib/inventory"

type Address = {
  id: number
  fullName: string
  phone: string
  address: string
  landmark?: string
  city: string
  state: string
  pincode: string
  type: string
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

const createInvoiceNumber = () => {
  const now = new Date()
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("")
  const timePart = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("")
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase()

  return `TP-INV-${datePart}-${timePart}-${randomPart}`
}

const validateSharedInventory = async (
  items: Array<{
    name: string
    description: string
    quantity: number
    size: string
    color?: string
  }>
) => {
  const requiredByColor = items.reduce<Record<string, { color: string; sizes: SizeStock }>>(
    (acc, item) => {
      const color = item.color || item.description.split("/")[0]?.trim()
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

  for (const [key, group] of Object.entries(requiredByColor)) {
    const inventorySnap = await getDoc(doc(db, "inventory", key))
    const stock: SizeStock = inventorySnap.exists()
      ? ({ ...emptySizeStock, ...inventorySnap.data().stockBySize } as SizeStock)
      : { ...emptySizeStock }

    for (const [size, quantity] of Object.entries(group.sizes)) {
      const available = Number(stock[size] || 0)

      if (available < quantity) {
        return {
          ok: false,
          message:
            available <= 0
              ? `${group.color} / ${size} is sold out. Please remove it from cart.`
              : `Only ${available} piece${available === 1 ? "" : "s"} left in ${group.color} / ${size}. Please reduce quantity.`,
        }
      }
    }
  }

  return {
    ok: true,
    message: "",
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCart()
  const { user, loading } = useAuth()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [coupon, setCoupon] = useState("")
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [placingOrder, setPlacingOrder] = useState(false)

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push("/login?redirect=/checkout")
      return
    }

    const savedAddresses = localStorage.getItem(
      `the-paddler-addresses-${user.uid}`
    )

    if (savedAddresses) {
      const parsed = JSON.parse(savedAddresses)
      setAddresses(parsed)

      if (parsed.length > 0) {
        setSelectedAddressId(parsed[0].id)
      }
    }
  }, [loading, router, user])

  const shipping = totalPrice >= 1500 ? 0 : 80
  const total = totalPrice + shipping - couponDiscount

  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase()

    if (!code) {
      setCouponDiscount(0)
      alert("Please enter a coupon code.")
      return
    }

    try {
      const couponSnap = await getDoc(doc(db, "coupons", code))
      let discountPercent = 0

      if (couponSnap.exists() && couponSnap.data().active !== false) {
        discountPercent = Number(couponSnap.data().discountPercent || 0)
      } else if (code === "PADDLER10") {
        discountPercent = 10
      }

      if (discountPercent <= 0) {
        setCouponDiscount(0)
        alert("Invalid or inactive coupon code.")
        return
      }

      setCouponDiscount(Math.round(totalPrice * (discountPercent / 100)))
      alert("Coupon applied successfully!")
    } catch (error) {
      console.error("COUPON APPLY ERROR:", error)
      setCouponDiscount(0)
      alert("Unable to check coupon right now.")
    }
  }

  const handlePayment = async () => {
    if (items.length === 0) {
      alert("Your cart is empty.")
      return
    }

    if (!user) {
      router.push("/login?redirect=/checkout")
      return
    }

    const selectedAddress = addresses.find(
      (address) => address.id === selectedAddressId
    )

    if (!selectedAddress) {
      alert("Please select or add a delivery address.")
      return
    }

    setPlacingOrder(true)

    try {
      const inventoryCheck = await validateSharedInventory(items)

      if (!inventoryCheck.ok) {
        alert(inventoryCheck.message)
        return
      }

      const invoiceNumber = createInvoiceNumber()

      const orderRef = await addDoc(collection(db, "orders"), {
        invoiceNumber,
        userId: user.uid,
        customer: {
          name: user.displayName || selectedAddress.fullName,
          email: user.email || "",
          phone: selectedAddress.phone,
        },
        items,
        address: selectedAddress,
        pricing: {
          subtotal: totalPrice,
          shipping,
          couponCode: couponDiscount > 0 ? coupon.trim().toUpperCase() : null,
          couponDiscount,
          total,
        },
        payment: {
          gateway: "razorpay",
          status: "pending",
        },
        status: "pending_payment",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      await addDoc(collection(db, "invoices"), {
        invoiceNumber,
        orderId: orderRef.id,
        userId: user.uid,
        customerEmail: user.email || "",
        total,
        paymentStatus: "pending",
        createdAt: new Date().toISOString(),
      })

      const response = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderRef.id,
          amount: total,
          customer: {
            email: user.email || "",
            phone: selectedAddress.phone,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok || !data?.razorpayOrderId || !data?.keyId) {
        console.error("RAZORPAY CREATE PAYMENT ERROR:", data)
        alert(
          data?.message ||
            "Order created, but Razorpay payment could not start. Please contact support."
        )
        router.push("/orders")
        return
      }

      const razorpayLoaded = await loadRazorpayCheckout()

      if (!razorpayLoaded || !window.Razorpay) {
        alert("Razorpay checkout could not load. Please try again.")
        router.push("/orders")
        return
      }

      const checkout = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || "INR",
        name: "THE PADDLER",
        description: `Order #${orderRef.id}`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: user.displayName || selectedAddress.fullName,
          email: user.email || "",
          contact: selectedAddress.phone,
        },
        notes: {
          orderId: orderRef.id,
          invoiceNumber,
        },
        theme: {
          color: "#000000",
        },
        modal: {
          ondismiss: () => {
            setPlacingOrder(false)
            router.push("/orders")
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
                orderId: orderRef.id,
                ...paymentResponse,
              }),
            })
            const verifyData = await verifyResponse.json()

            if (!verifyResponse.ok || !verifyData?.ok) {
              alert(
                verifyData?.message ||
                  "Payment received, but verification failed. Please contact support."
              )
              router.push("/orders")
              return
            }

            clearCart()
            router.push("/orders")
          } catch (error) {
            console.error("RAZORPAY VERIFY CLIENT ERROR:", error)
            alert(
              "Payment received, but verification could not complete. Please contact support."
            )
            router.push("/orders")
          } finally {
            setPlacingOrder(false)
          }
        },
      })

      checkout.on("payment.failed", async (paymentFailure) => {
        await updateDoc(orderRef, {
          status: "payment_failed",
          "payment.status": "failed",
          "payment.failureReason":
            paymentFailure.error?.description ||
            paymentFailure.error?.reason ||
            null,
          updatedAt: new Date().toISOString(),
        })
        setPlacingOrder(false)
        router.push("/orders")
      })

      checkout.open()
    } catch (error) {
      console.error("ORDER CREATE ERROR:", error)
      alert("Unable to create order. Please try again.")
    } finally {
      setPlacingOrder(false)
    }
  }

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-black mb-4">YOUR CART IS EMPTY</h1>
            <p className="text-muted-foreground mb-8">
              Add products before checkout.
            </p>
            <Link
              href="/shop"
              className="inline-block bg-foreground text-background px-8 py-4 font-black"
            >
              SHOP NOW
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
            SECURE CHECKOUT
          </p>

          <h1 className="text-4xl font-black mb-10">
            CHECKOUT
          </h1>

          <div className="grid lg:grid-cols-[1fr_420px] gap-10">

            {/* LEFT */}
            <div className="space-y-8">

              {/* Address */}
              <section className="border border-border bg-secondary/20 p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <h2 className="text-2xl font-black flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    DELIVERY ADDRESS
                  </h2>

                  <Link
                    href="/addresses"
                    className="text-sm underline text-muted-foreground hover:text-foreground"
                  >
                    Add / Edit Address
                  </Link>
                </div>

                {addresses.length === 0 ? (
                  <div className="border border-border p-6 text-center">
                    <p className="text-muted-foreground mb-5">
                      No saved address found.
                    </p>

                    <Link
                      href="/addresses"
                      className="inline-block bg-foreground text-background px-6 py-3 text-sm font-black"
                    >
                      ADD ADDRESS
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {addresses.map((address) => (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => setSelectedAddressId(address.id)}
                        className={`w-full text-left border p-5 transition-colors ${
                          selectedAddressId === address.id
                            ? "border-foreground bg-background"
                            : "border-border bg-background/40 hover:border-foreground"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="inline-block mb-3 px-3 py-1 bg-foreground text-background text-xs font-black">
                              {address.type}
                            </span>

                            <h3 className="font-black">
                              {address.fullName}
                            </h3>

                            <p className="text-sm text-muted-foreground mt-2">
                              {address.phone}
                            </p>

                            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                              {address.address}, {address.city}, {address.state} - {address.pincode}
                            </p>

                            {address.landmark && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Landmark: {address.landmark}
                              </p>
                            )}
                          </div>

                          <span className="text-sm font-bold">
                            {selectedAddressId === address.id ? "SELECTED" : "SELECT"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Payment */}
              <section className="border border-border bg-secondary/20 p-6 sm:p-8">
                <h2 className="text-2xl font-black flex items-center gap-2 mb-6">
                  <Lock className="w-5 h-5" />
                  PAYMENT
                </h2>

                <div className="border border-border p-5 mb-5">
                  <p className="font-black mb-2">
                    Prepaid Payment Only
                  </p>

                  <p className="text-sm text-muted-foreground">
                    We currently accept prepaid payments only. COD is not available.
                  </p>
                </div>

                <div className="border border-green-700 bg-green-950/30 p-5">
                  <p className="font-black text-green-400">
                    Secure online payment through Razorpay
                  </p>

                  <p className="text-sm text-muted-foreground mt-1">
                    Your order is confirmed after successful Razorpay payment.
                  </p>
                </div>
              </section>

              {/* Delivery */}
              <section className="border border-border bg-secondary/20 p-6 sm:p-8">
                <h2 className="text-2xl font-black flex items-center gap-2 mb-5">
                  <Truck className="w-5 h-5" />
                  DELIVERY ESTIMATE
                </h2>

                <p className="text-muted-foreground">
                  Estimated delivery: <span className="text-foreground font-bold">3–7 business days</span>
                </p>

                <p className="text-sm text-muted-foreground mt-3">
                  Exact ETA will be updated after courier pickup.
                </p>
              </section>

            </div>

            {/* RIGHT ORDER SUMMARY */}
            <aside className="border border-border bg-secondary/20 p-6 h-fit sticky top-24">
              <h2 className="text-2xl font-black mb-6">
                ORDER SUMMARY
              </h2>

              <div className="space-y-5 mb-6">
                {items.map((item) => (
                  <div
                    key={`${item.id}-${item.size}`}
                    className="flex gap-4 border-b border-border pb-5"
                  >
                    <div className="relative w-20 h-24 bg-neutral-900 flex-shrink-0 overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-black text-sm">
                        {item.name}
                      </h3>

                      <p className="text-xs text-muted-foreground mt-1">
                        Size: {item.size}
                      </p>

                      <p className="text-xs text-muted-foreground mt-1">
                        Qty: {item.quantity}
                      </p>

                      <p className="font-bold mt-2">
                        ₹{item.price * item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="mb-6">
                <p className="text-sm font-black mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  COUPON CODE
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon"
                    className="flex-1 bg-background border border-border px-4 py-3 outline-none focus:border-foreground text-white"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                  />

                  <button
                    onClick={applyCoupon}
                    className="bg-foreground text-background px-5 py-3 text-sm font-black"
                  >
                    APPLY
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  Try demo coupon: PADDLER10
                </p>
              </div>

              <div className="space-y-4 text-sm border-t border-border pt-5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{totalPrice}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-black border-t border-border pt-5">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={placingOrder}
                className="w-full mt-8 bg-foreground text-background py-4 font-black hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Lock className="w-4 h-4" />
                {placingOrder ? "CREATING ORDER..." : `PAY ₹${total}`}
              </button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Razorpay checkout will open securely after creating your order.
              </p>
            </aside>

          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
