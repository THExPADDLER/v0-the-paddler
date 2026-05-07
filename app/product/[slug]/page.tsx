"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Minus, Plus, Check, Truck, Shield, RotateCcw } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getProductBySlug, getRelatedProducts } from "@/lib/products"
import { useCart } from "@/lib/cart-context"

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { addItem } = useCart()
  
  const product = getProductBySlug(params.slug as string)
  
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<"details" | "care">("details")
  const [addedToCart, setAddedToCart] = useState(false)

  if (!product) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="pt-32 pb-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link href="/shop" className="text-accent underline">
            Back to Shop
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      return
    }
    
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        description: `${product.color} / ${selectedSize}`,
        price: product.price,
        image: product.image,
        size: selectedSize,
      })
    }
    
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1)
  }

  const increaseQuantity = () => {
    if (quantity < 10) setQuantity(quantity + 1)
  }

  const relatedProducts = getRelatedProducts(product.slug, 3)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-24 pb-20">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Product Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Product Image */}
            <div className="relative">
              <div className="aspect-square bg-neutral-900 overflow-hidden sticky top-24">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
                {product.badge && (
                  <span className={`absolute top-4 left-4 px-3 py-1.5 text-xs font-medium ${product.badgeColor}`}>
                    {product.badge}
                  </span>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              {/* Header */}
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                  {product.name}
                </h1>
                <p className="text-2xl font-medium">&#8377;{product.price}</p>
              </div>

              {/* Description */}
              <p className="text-muted-foreground leading-relaxed mb-8">
                {product.longDescription}
              </p>

              {/* Color Display */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">COLOR</span>
                  <span className="text-sm text-muted-foreground">{product.color}</span>
                </div>
                <div className="flex gap-3">
                  <div
                    className="w-10 h-10 rounded-full border-2 border-accent flex items-center justify-center"
                    style={{ backgroundColor: product.colorHex }}
                  >
                    <Check className={`w-4 h-4 ${product.color === "White" || product.color === "Beige" ? "text-black" : "text-white"}`} />
                  </div>
                </div>
              </div>

              {/* Size Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">SIZE</span>
                  <button className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[60px] h-12 px-6 border text-sm font-medium transition-all ${
                        selectedSize === size
                          ? "border-accent bg-accent text-background"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {!selectedSize && (
                  <p className="text-sm text-red-500 mt-2">Please select a size</p>
                )}
              </div>

              {/* Quantity */}
              <div className="mb-8">
                <span className="text-sm font-medium block mb-3">QUANTITY</span>
                <div className="flex items-center border border-border w-fit">
                  <button
                    onClick={decreaseQuantity}
                    className="w-12 h-12 flex items-center justify-center hover:bg-muted transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 h-12 flex items-center justify-center font-medium border-x border-border">
                    {quantity}
                  </span>
                  <button
                    onClick={increaseQuantity}
                    className="w-12 h-12 flex items-center justify-center hover:bg-muted transition-colors"
                    disabled={quantity >= 10}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              {product.inStock ? (
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedSize}
                  className={`w-full py-4 font-medium text-sm tracking-wide transition-all mb-4 ${
                    addedToCart
                      ? "bg-green-600 text-white"
                      : selectedSize
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {addedToCart ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      ADDED TO CART
                    </span>
                  ) : (
                    `ADD TO CART — ₹${product.price * quantity}`
                  )}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-4 bg-neutral-800 text-muted-foreground font-medium text-sm tracking-wide cursor-not-allowed mb-4"
                >
                  SOLD OUT
                </button>
              )}

              {/* Buy Now */}
              {product.inStock && (
                <Link
                  href="/checkout"
                  className="w-full py-4 border border-foreground text-center font-medium text-sm tracking-wide hover:bg-foreground hover:text-background transition-all mb-8 block"
                >
                  BUY NOW
                </Link>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 py-6 border-y border-border mb-8">
                <div className="text-center">
                  <Truck className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Free Shipping</p>
                  <p className="text-xs text-muted-foreground">Orders ₹1500+</p>
                </div>
                <div className="text-center">
                  <Shield className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Secure</p>
                  <p className="text-xs text-muted-foreground">Payment</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">7 Day</p>
                  <p className="text-xs text-muted-foreground">Returns</p>
                </div>
              </div>

              {/* Product Details Tabs */}
              <div>
                <div className="flex border-b border-border mb-4">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`py-3 px-4 text-sm font-medium transition-colors ${
                      activeTab === "details"
                        ? "border-b-2 border-foreground text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab("care")}
                    className={`py-3 px-4 text-sm font-medium transition-colors ${
                      activeTab === "care"
                        ? "border-b-2 border-foreground text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Care Instructions
                  </button>
                </div>
                
                {activeTab === "details" && (
                  <ul className="space-y-2">
                    {product.details.map((detail, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="w-1 h-1 rounded-full bg-accent mt-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}
                
                {activeTab === "care" && (
                  <ul className="space-y-2">
                    {product.care.map((instruction, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="w-1 h-1 rounded-full bg-accent mt-2 flex-shrink-0" />
                        {instruction}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Related Products */}
          <section className="mt-20 pt-12 border-t border-border">
            <h2 className="text-xl font-bold tracking-tight mb-8">YOU MAY ALSO LIKE</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  href={`/product/${relatedProduct.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-square bg-neutral-900 overflow-hidden">
                    <Image
                      src={relatedProduct.image}
                      alt={relatedProduct.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {relatedProduct.badge && (
                      <span className={`absolute top-3 left-3 px-2 py-1 text-xs font-medium ${relatedProduct.badgeColor}`}>
                        {relatedProduct.badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-medium">{relatedProduct.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{relatedProduct.color}</p>
                    </div>
                    <span className="text-sm font-medium">&#8377;{relatedProduct.price}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
