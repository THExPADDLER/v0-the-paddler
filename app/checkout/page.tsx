"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Lock, MapPin, Tag, Truck } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useCart } from "@/lib/cart-context"

type Address = {
  id: number
  fullName: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  type: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice } = useCart()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [coupon, setCoupon] = useState("")
  const [couponDiscount, setCouponDiscount] = useState(0)

  useEffect(() => {
    const user = localStorage.getItem("user")

    if (!user) {
      router.push("/login?redirect=/checkout")
      return
    }

    const savedAddresses = localStorage.getItem("the-paddler-addresses")

    if (savedAddresses) {
      const parsed = JSON.parse(savedAddresses)
      setAddresses(parsed)

      if (parsed.length > 0) {
        setSelectedAddressId(parsed[0].id)
      }
    }
  }, [router])

  const shipping = totalPrice >= 1500 ? 0 : 80
  const prepaidDiscount = Math.round(totalPrice * 0.05)
  const total = totalPrice + shipping - prepaidDiscount - couponDiscount

  const applyCoupon = () => {
    if (coupon.toUpperCase() === "PADDLER10") {
      setCouponDiscount(Math.round(totalPrice * 0.1))
      alert("Coupon applied successfully!")
    } else {
      setCouponDiscount(0)
      alert("Invalid coupon code")
    }
  }

  const handlePayment = () => {
    if (items.length === 0) {
      alert("Your cart is empty.")
      return
    }

    if (!selectedAddressId) {
      alert("Please select or add a delivery address.")
      return
    }

    alert("Razorpay payment integration will be connected in backend step.")
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
                    5% OFF applied on prepaid order
                  </p>

                  <p className="text-sm text-muted-foreground mt-1">
                    Discount automatically applied at checkout.
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

                <div className="flex justify-between text-green-400">
                  <span>Prepaid Discount</span>
                  <span>-₹{prepaidDiscount}</span>
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
                className="w-full mt-8 bg-foreground text-background py-4 font-black hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                PAY ₹{total}
              </button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Secured by Razorpay. Backend integration pending.
              </p>
            </aside>

          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}