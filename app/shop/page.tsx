"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, SlidersHorizontal } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { products } from "@/lib/products"
import { useWishlist } from "@/lib/wishlist-context"

type SortOption = "featured" | "price-low" | "price-high"
type StockOption = "all" | "in-stock" | "sold-out"

const colorOptions = ["All", ...Array.from(new Set(products.map((product) => product.color)))]

export default function ShopPage() {
  const [selectedColor, setSelectedColor] = useState("All")
  const [stock, setStock] = useState<StockOption>("all")
  const [sort, setSort] = useState<SortOption>("featured")
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const colorMatch = selectedColor === "All" || product.color === selectedColor
      const stockMatch =
        stock === "all" ||
        (stock === "in-stock" && product.inStock) ||
        (stock === "sold-out" && !product.inStock)

      return colorMatch && stockMatch
    })

    return [...filtered].sort((a, b) => {
      if (sort === "price-low") return a.price - b.price
      if (sort === "price-high") return b.price - a.price
      return a.id - b.id
    })
  }, [selectedColor, sort, stock])

  return (
    <>
      <Header />

      <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
        <section className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              THE CURRENT DROP
            </p>

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
                  SHOP
                </h1>

                <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed">
                  Premium oversized streetwear in limited runs. Pick your fit before the drop moves on.
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <SlidersHorizontal className="w-4 h-4" />
                {filteredProducts.length} of {products.length} products
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between mb-10">
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2 border text-sm font-bold transition-colors ${
                    selectedColor === color
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:border-foreground"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <select
                value={stock}
                onChange={(event) => setStock(event.target.value as StockOption)}
                className="bg-background border border-border px-4 py-3 text-sm font-bold outline-none"
              >
                <option value="all">All Stock</option>
                <option value="in-stock">In Stock</option>
                <option value="sold-out">Sold Out</option>
              </select>

              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortOption)}
                className="bg-background border border-border px-4 py-3 text-sm font-bold outline-none"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="border border-border bg-secondary/20 py-20 text-center">
              <h2 className="text-2xl font-black mb-3">NO PRODUCTS FOUND</h2>
              <p className="text-muted-foreground">
                Try changing the filters to view more pieces.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const saved = isInWishlist(product.id)
                const hoverImage = product.images?.[1] || product.image

                return (
                  <div key={product.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (saved) {
                          removeFromWishlist(product.id)
                        } else {
                          addToWishlist({
                            id: product.id,
                            name: product.name,
                            description: product.description,
                            price: product.price,
                            mrp: product.mrp,
                            image: product.image,
                            slug: product.slug,
                          })
                        }
                      }}
                      className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-background/90 backdrop-blur flex items-center justify-center hover:scale-110 transition-transform"
                      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart
                        className={`w-5 h-5 transition-colors ${
                          saved ? "fill-red-500 text-red-500" : "text-foreground"
                        }`}
                      />
                    </button>

                    <Link href={`/product/${product.slug}`} className="block">
                      <div className="relative aspect-square bg-neutral-900 overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:opacity-0"
                        />

                        <Image
                          src={hoverImage}
                          alt={`${product.name} alternate view`}
                          fill
                          className="object-cover scale-105 opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-110"
                        />

                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />

                        {product.badge && (
                          <span className={`absolute top-3 left-3 px-2 py-1 text-xs font-bold ${product.badgeColor}`}>
                            {product.badge}
                          </span>
                        )}

                        {!product.inStock && (
                          <span className="absolute bottom-3 left-3 bg-background text-foreground px-3 py-1 text-xs font-black">
                            SOLD OUT
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-sm font-black group-hover:underline underline-offset-4">
                            {product.name}
                          </h2>

                          <p className="text-xs text-muted-foreground mt-1">
                            {product.color} / {product.description}
                          </p>
                        </div>

                        <div className="text-right whitespace-nowrap">
                          {product.mrp && product.mrp > product.price && (
                            <p className="relative inline-block text-xs text-muted-foreground">
                              <span className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-white z-10" />
                              MRP ₹{product.mrp}
                            </p>
                          )}

                          <p className="text-base font-black text-accent">
                            ₹{product.price}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  )
}
