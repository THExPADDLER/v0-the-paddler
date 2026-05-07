"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { products } from "@/lib/products"
import { cn } from "@/lib/utils"

const colors = [
  { name: "All", value: "all" },
  { name: "Black", value: "Black", hex: "#0a0a0a" },
  { name: "White", value: "White", hex: "#f5f5f5" },
  { name: "Emerald Green", value: "Emerald Green", hex: "#047857" },
  { name: "Beige", value: "Beige", hex: "#d4b896" },
]

const sizes = ["All", "S", "M", "L"]

export default function ShopPage() {
  const [selectedColor, setSelectedColor] = useState("all")
  const [selectedSize, setSelectedSize] = useState("All")
  const [sortBy, setSortBy] = useState("featured")

  const filteredProducts = products.filter((product) => {
    const colorMatch = selectedColor === "all" || product.color === selectedColor
    const sizeMatch = selectedSize === "All" || product.sizes.includes(selectedSize)
    return colorMatch && sizeMatch && product.inStock
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "newest":
        return b.id - a.id
      default:
        return 0
    }
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-24 pb-20">
        {/* Hero Banner */}
        <div className="bg-neutral-900 py-16 mb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              THE COLLECTION
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Premium oversized tees crafted from 240 GSM heavyweight cotton. 
              Built for those who move different.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10 pb-6 border-b border-border">
            {/* Color Filter */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground mr-2">COLOR:</span>
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-sm border transition-all",
                    selectedColor === color.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  {color.hex && (
                    <span 
                      className="w-3 h-3 rounded-full border border-border"
                      style={{ backgroundColor: color.hex }}
                    />
                  )}
                  {color.name}
                </button>
              ))}
            </div>

            {/* Size Filter */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground mr-2">SIZE:</span>
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    "px-3 py-1.5 text-sm border transition-all min-w-[44px]",
                    selectedSize === size
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">SORT:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-background border border-border px-3 py-1.5 text-sm focus:outline-none focus:border-foreground"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-8">
            <p className="text-sm text-muted-foreground">
              Showing {sortedProducts.length} of {products.filter(p => p.inStock).length} products
            </p>
          </div>

          {/* Products Grid */}
          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {sortedProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-square bg-neutral-900 overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {product.badge && (
                      <span className={`absolute top-3 left-3 px-2 py-1 text-xs font-medium ${product.badgeColor}`}>
                        {product.badge}
                      </span>
                    )}
                    {/* Quick View Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-foreground text-background px-4 py-2 text-sm font-medium">
                        VIEW DETAILS
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-medium group-hover:text-accent transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {product.color}
                        </p>
                      </div>
                      <span className="text-sm font-medium">&#8377;{product.price}</span>
                    </div>
                    {/* Color indicator */}
                    <div className="flex items-center gap-2 mt-2">
                      <span 
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: product.colorHex }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {product.sizes.join(" / ")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl font-medium mb-2">No products found</p>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters to find what you&apos;re looking for.
              </p>
              <button
                onClick={() => {
                  setSelectedColor("all")
                  setSelectedSize("All")
                }}
                className="px-6 py-3 bg-foreground text-background font-medium text-sm hover:bg-foreground/90 transition-colors"
              >
                CLEAR FILTERS
              </button>
            </div>
          )}

          {/* Bottom CTA */}
          <div className="mt-20 text-center py-16 border-t border-border">
            <h2 className="text-2xl font-bold mb-4">CAN&apos;T FIND WHAT YOU&apos;RE LOOKING FOR?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Follow us on Instagram for new drops and exclusive releases.
            </p>
            <Link
              href="https://instagram.com/thepaddler.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 border border-foreground text-sm font-medium hover:bg-foreground hover:text-background transition-colors"
            >
              @THEPADDLER.IN
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
