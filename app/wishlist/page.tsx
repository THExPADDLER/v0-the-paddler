"use client"

import Image from "next/image"
import Link from "next/link"
import { Heart, ShoppingBag, Trash2 } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useWishlist } from "@/lib/wishlist-context"

export default function WishlistPage() {
  const { items, removeFromWishlist } = useWishlist()

  return (
    <>
      <Header />

      <main className="min-h-screen bg-black text-white pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4">

          <p className="text-xs tracking-[0.35em] text-neutral-500 mb-3">
            SAVED ITEMS
          </p>

          <h1 className="text-4xl font-black mb-12">
            YOUR WISHLIST
          </h1>

          {items.length === 0 ? (
            <div className="border border-neutral-800 p-16 text-center">
              <Heart className="w-12 h-12 mx-auto mb-6 text-neutral-500" />

              <h2 className="text-2xl font-bold mb-3">
                YOUR WISHLIST IS EMPTY
              </h2>

              <p className="text-neutral-500 mb-8">
                Save your favourite drops before they sell out.
              </p>

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 text-sm font-bold"
              >
                <ShoppingBag className="w-4 h-4" />
                EXPLORE SHOP
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border border-neutral-800 bg-black"
                >
                  <div className="relative w-full h-[360px] bg-neutral-900">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={500}
                      height={650}
                      className="object-cover"
                      priority
                    />
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-sm">
                          {item.name}
                        </h3>

                        <p className="text-xs text-neutral-500 mt-1">
                          {item.description}
                        </p>

                        <div className="mt-4">
                          {item.mrp && item.mrp > item.price && (
                            <p className="relative inline-block text-xs text-neutral-500">
                              <span className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-white z-10" />
                              MRP ₹{item.mrp}
                            </p>
                          )}

                          <p className="text-lg font-black text-white">
                            ₹{item.price}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        className="p-2 hover:bg-neutral-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <Link
                      href={item.slug ? `/product/${item.slug}` : "/shop"}
                      className="block mt-5 w-full bg-white text-black py-3 text-center text-sm font-black"
                    >
                      VIEW PRODUCT
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </>
  )
}
