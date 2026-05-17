"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, X, ArrowLeft, ShoppingBag } from "lucide-react"
import { useRouter } from "next/navigation"

import { useCart } from "@/lib/cart-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function CartPage() {
  const router = useRouter()

  const { items, removeItem, updateQuantity, totalPrice } = useCart()

  const shipping = 0
  const total = totalPrice + shipping

  const handleProceedToCheckout = () => {
    const user = localStorage.getItem("user")

    if (!user) {
      router.push("/login?redirect=/checkout")
      return
    }

    router.push("/checkout")
  }

  if (items.length === 0) {
    return (
      <>
        <Header />

        <main className="min-h-screen bg-background pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
                <ShoppingBag className="w-10 h-10 text-muted-foreground" />
              </div>

              <h1 className="text-2xl font-bold mb-2">
                YOUR CART IS EMPTY
              </h1>

              <p className="text-muted-foreground mb-8 max-w-md">
                Looks like you haven&apos;t added anything to your cart yet.
                Explore our latest drops and find something you love.
              </p>

              <Link
                href="/#shop"
                className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3 text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                CONTINUE SHOPPING
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>

            <span>/</span>

            <span className="text-foreground">Cart</span>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">

            {/* Cart Items */}
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold mb-8">
                YOUR CART
              </h1>

              <div className="space-y-6">
                {items.map((item) => (
                  <div
                    key={`${item.id}-${item.size}`}
                    className="flex gap-4 sm:gap-6 p-4 bg-secondary/30 border border-border"
                  >

                    {/* Product Image */}
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-neutral-100 flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 flex flex-col justify-between">

                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-sm sm:text-base">
                            {item.name}
                          </h3>

                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.description}
                          </p>

                          <p className="text-xs text-muted-foreground mt-1">
                            Size: {item.size}
                          </p>
                        </div>

                        <button
                          onClick={() => removeItem(item.id, item.size)}
                          className="p-1 hover:bg-secondary rounded transition-colors"
                          aria-label="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4">

                        {/* Quantity Controls */}
                        <div className="flex items-center border border-border">

                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.size,
                                item.quantity - 1
                              )
                            }
                            className="p-2 hover:bg-secondary transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <span className="px-4 py-2 text-sm font-medium min-w-[40px] text-center">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.size,
                                item.quantity + 1
                              )
                            }
                            className="p-2 hover:bg-secondary transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>

                        </div>

                        {/* Price */}
                        <span className="font-medium">
                          ₹{item.price * item.quantity}
                        </span>

                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue Shopping */}
              <Link
                href="/#shop"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-8 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Continue Shopping
              </Link>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-secondary/30 border border-border p-6 sticky top-24">

                <h2 className="text-lg font-bold mb-6">
                  ORDER SUMMARY
                </h2>

                <div className="space-y-4 text-sm">

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Subtotal
                    </span>

                    <span>
                      ₹{totalPrice}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Shipping
                    </span>

                    <span className="text-accent">
                      FREE
                    </span>
                  </div>

                  <div className="border-t border-border pt-4 flex justify-between font-bold text-base">
                    <span>Total</span>

                    <span>
                      ₹{total}
                    </span>
                  </div>

                </div>

                <button
                  onClick={handleProceedToCheckout}
                  className="w-full mt-6 bg-foreground text-background py-4 text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
                >
                  PROCEED TO CHECKOUT
                </button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Taxes calculated at checkout
                </p>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-border">

                  <div className="flex flex-col gap-3 text-xs text-muted-foreground">

                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>

                      <span>
                        Secure SSL Encryption
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>

                      <span>
                        Free Returns within 14 days
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>

                      <span>
                        Express Shipping Available
                      </span>
                    </div>

                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </>
  )
} 
