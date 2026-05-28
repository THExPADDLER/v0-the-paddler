"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Minus,
  Plus,
  Check,
  Truck,
  Shield,
  RotateCcw,
  Heart,
  Tag,
  Bell,
  MapPin,
} from "lucide-react"
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { db } from "@/lib/firebase"
import { useCart } from "@/lib/cart-context"
import { useWishlist } from "@/lib/wishlist-context"

const SAVED_COUPON_KEY = "paddlerCouponCode"
import { getSharedInventory, type SizeStock } from "@/lib/inventory"
import {
  getProductBySlug,
  getRelatedProducts,
  type Product,
} from "@/lib/products"

const pincodeData: Record<string, string> = {
  "450331": "Burhanpur",
  "450001": "Khandwa",
  "462001": "Bhopal",
  "452001": "Indore",
  "456001": "Ujjain",
  "400001": "Mumbai",
  "110001": "New Delhi",
  "560001": "Bengaluru",
}

const getDisplayMrp = (product: Product) => {
  const fallbackMrp = 1999
  const mrp = product.mrp || fallbackMrp

  return mrp > product.price ? mrp : null
}

const getApproxDeliveryDate = () => {
  const date = new Date()
  date.setDate(date.getDate() + 7)

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

const getTotalStock = (product: Product) => {
  if (product.stockBySize) {
    return Object.values(product.stockBySize).reduce(
      (sum, value) => sum + Number(value || 0),
      0
    )
  }

  if (typeof product.stock === "number") return product.stock

  return product.inStock ? 20 : 0
}

const getSizeStock = (product: Product, size: string) => {
  if (product.stockBySize) return Number(product.stockBySize[size] || 0)
  return product.inStock ? getTotalStock(product) : 0
}

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { addItem } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  const slug = params.slug as string

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<"details" | "care">("details")
  const [addedToCart, setAddedToCart] = useState(false)
  const [pincode, setPincode] = useState("")
  const [deliveryMessage, setDeliveryMessage] = useState("")
  const [notifyEmail, setNotifyEmail] = useState("")
  const [coupon, setCoupon] = useState("")
  const [couponMessage, setCouponMessage] = useState("")
  const [sharedStockBySize, setSharedStockBySize] = useState<SizeStock | null>(null)
  const [activeImage, setActiveImage] = useState("")
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%")
  const [isImageZoomed, setIsImageZoomed] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      const localProduct = getProductBySlug(slug) || null

      const applyLocalProduct = () => {
        setProduct(localProduct)
        setRelatedProducts(localProduct ? getRelatedProducts(slug, 3) : [])
      }

      try {
        setLoading(true)

        const productRef = doc(db, "products", slug)
        const productSnap = await getDoc(productRef)

        if (!productSnap.exists()) {
          applyLocalProduct()
          return
        }

        const productData = productSnap.data() as Product
        const displayMrp = productData.mrp || localProduct?.mrp || 1999

        productData.mrp = displayMrp > productData.price ? displayMrp : undefined
        setProduct(productData)

        const relatedQuery = query(
          collection(db, "products"),
          where("slug", "!=", slug),
          limit(3)
        )

        const relatedSnap = await getDocs(relatedQuery)
        const relatedData = relatedSnap.docs.map((item) => {
          const relatedProduct = item.data() as Product
          const relatedLocalProduct = getProductBySlug(relatedProduct.slug)
          const relatedMrp = relatedProduct.mrp || relatedLocalProduct?.mrp || 1999

          return {
            ...relatedProduct,
            mrp: relatedMrp > relatedProduct.price ? relatedMrp : undefined,
          }
        }) as Product[]

        setRelatedProducts(relatedData)
      } catch (error) {
        console.error("PRODUCT FETCH ERROR:", error)
        applyLocalProduct()
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [slug])

  useEffect(() => {
    setActiveImage("")
  }, [slug])

  useEffect(() => {
    const fetchSharedStock = async () => {
      if (!product?.color) return

      try {
        const stock = await getSharedInventory(product.color)
        setSharedStockBySize(stock || null)
      } catch (error) {
        console.error("SHARED INVENTORY FETCH ERROR:", error)
        setSharedStockBySize(null)
      }
    }

    fetchSharedStock()
  }, [product?.color])

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="pt-32 pb-20 text-center">
          <p className="text-muted-foreground">Loading product...</p>
        </main>
        <Footer />
      </div>
    )
  }

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

  const saved = isInWishlist(product.id)
  const inventoryProduct = sharedStockBySize
    ? {
        ...product,
        stockBySize: sharedStockBySize,
        stock: Object.values(sharedStockBySize).reduce(
          (sum, value) => sum + Number(value || 0),
          0
        ),
        inStock: Object.values(sharedStockBySize).some(
          (value) => Number(value || 0) > 0
        ),
      }
    : product
  const totalStock = getTotalStock(inventoryProduct)
  const lowStock =
    inventoryProduct.inStock &&
    totalStock > 0 &&
    totalStock <= 5
  const displayMrp = getDisplayMrp(product)
  const discountPercent = displayMrp
    ? Math.round(((displayMrp - product.price) / displayMrp) * 100)
    : 0
  const productImages = product.images?.length ? product.images : [product.image]
  const selectedImage = activeImage || productImages[0] || product.image

  const handleImageZoom = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    setZoomOrigin(`${x}% ${y}%`)
    setIsImageZoomed(true)
  }

  const handleWishlist = () => {
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
  }

  const handleAddToCart = () => {
    if (!selectedSize) return

    const availableStock = getSizeStock(inventoryProduct, selectedSize)

    if (availableStock <= 0) {
      alert("Selected size is sold out.")
      return
    }

    if (quantity > availableStock) {
      alert(`Only ${availableStock} piece${availableStock === 1 ? "" : "s"} left in size ${selectedSize}.`)
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
        color: product.color,
      })
    }

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleBuyNow = () => {
    if (!selectedSize) {
      alert("Please select a size first.")
      return
    }

    handleAddToCart()
    router.push("/cart")
  }

  const checkDelivery = async () => {
    const clean = pincode.replace(/\D/g, "").slice(0, 6)

    if (clean.length !== 6) {
      setDeliveryMessage("Enter a valid 6-digit pincode.")
      return
    }

    const city = pincodeData[clean]
    const deliveryDate = getApproxDeliveryDate()

    try {
      setDeliveryMessage("Checking courier availability...")

      const response = await fetch(
        `/api/shiprocket/serviceability?pincode=${encodeURIComponent(clean)}`
      )
      const data = await response.json()

      if (response.ok && data?.serviceable) {
        const deliveryCity = data.city || city
        const courierText = data.courierName ? ` via ${data.courierName}` : ""

        setDeliveryMessage(
          `Delivery available${
            deliveryCity ? ` in ${deliveryCity}` : ""
          }${courierText}. Approx delivery by ${deliveryDate}.`
        )
        return
      }

      if (response.ok && data?.serviceable === false) {
        setDeliveryMessage("Delivery is currently not serviceable for this pincode.")
        return
      }

      setDeliveryMessage(
        `Approx delivery by ${deliveryDate}. Final courier availability will be confirmed before dispatch.`
      )
      return
    } catch (error) {
      console.error("SERVICEABILITY CHECK ERROR:", error)
    }

    if (city) {
      setDeliveryMessage(
        `Delivery available in ${city}. Approx delivery by ${deliveryDate}.`
      )
    } else {
      setDeliveryMessage(
        `Delivery available for this pincode. Approx delivery by ${deliveryDate}.`
      )
    }
  }

  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase()

    if (!code) {
      setCouponMessage("Enter a coupon code to check.")
      return
    }

    try {
      const couponSnap = await getDoc(doc(db, "coupons", code))

      if (couponSnap.exists() && couponSnap.data().active !== false) {
        const discountPercent = Number(couponSnap.data().discountPercent || 0)
        localStorage.setItem(SAVED_COUPON_KEY, code)
        setCouponMessage(
          `Coupon available: ${discountPercent}% OFF at checkout.`
        )
        return
      }

      if (localStorage.getItem(SAVED_COUPON_KEY) === code) {
        localStorage.removeItem(SAVED_COUPON_KEY)
      }
      setCouponMessage("This coupon is not active right now.")
    } catch (error) {
      console.error("COUPON CHECK ERROR:", error)
      setCouponMessage("Unable to check coupon right now.")
    }
  }

  const handleNotifyMe = async () => {
    if (!notifyEmail) {
      alert("Please enter your email.")
      return
    }

    try {
      await addDoc(collection(db, "notifyRequests"), {
        productSlug: product.slug,
      productId: product.id,
      productName: product.name,
      email: notifyEmail,
        source: "product",
        status: "open",
      createdAt: new Date().toISOString(),
      })

      setNotifyEmail("")
      alert("Done! We will notify you when this product restocks.")
    } catch (error) {
      console.error("NOTIFY REQUEST ERROR:", error)
      alert("Unable to save notify request. Please try again.")
    }
  }

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1)
  }

  const increaseQuantity = () => {
    const maxStock = selectedSize ? getSizeStock(inventoryProduct, selectedSize) : 10
    if (quantity < Math.min(10, maxStock)) setQuantity(quantity + 1)
  }

  return (
    <div className="product-page-stage min-h-screen bg-background text-foreground">
      <Header />

      <main className="relative overflow-hidden pt-24 pb-20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="pointer-events-none absolute left-0 right-0 top-32 rotate-[-2deg] border-y border-white/10 bg-white/5 py-2 text-xs font-black tracking-[0.45em] text-white/35 animate-[featured-ticker_22s_linear_infinite] whitespace-nowrap">
          PRODUCT DETAIL / ZOOM THE FABRIC / SELECT YOUR FIT / SECURE THE DROP / PRODUCT DETAIL / ZOOM THE FABRIC / SELECT YOUR FIT /
        </div>
        <div className="pointer-events-none absolute -right-20 top-44 text-[13vw] font-black leading-none text-white/[0.035] animate-[featured-word-drift_9s_ease-in-out_infinite]">
          DETAIL
        </div>
        <div className="pointer-events-none absolute left-8 bottom-[18%] text-[12vw] font-black leading-none text-white/[0.03] animate-[featured-word-drift_8s_ease-in-out_infinite_1s]">
          DROP
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <div className="relative product-gallery-stage">
              <div className="pointer-events-none absolute -inset-4 border border-white/10" />
              <div className="pointer-events-none absolute -left-4 top-8 z-20 hidden sm:block bg-white px-4 py-3 text-black shadow-2xl">
                <p className="text-2xl font-black">
                  {String(discountPercent || "NEW").padStart(2, "0")}
                </p>
                <p className="text-[10px] tracking-[0.25em] text-black/50">
                  DROP VIEW
                </p>
              </div>
              <div
                className="product-main-image aspect-square bg-neutral-900 overflow-hidden sticky top-24 group"
                onMouseMove={handleImageZoom}
                onMouseLeave={() => setIsImageZoomed(false)}
              >
                <Image
                  src={selectedImage}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-200 ease-out"
                  style={{
                    transformOrigin: zoomOrigin,
                    transform: isImageZoomed ? "scale(1.5)" : "scale(1)",
                  }}
                  priority
                />

                {product.badge && (
                  <span
                    className={`absolute top-4 left-4 px-3 py-1.5 text-xs font-medium ${product.badgeColor}`}
                  >
                    {product.badge}
                  </span>
                )}

                <button
                  onClick={handleWishlist}
                  className="absolute top-4 right-4 z-20 w-12 h-12 rounded-full bg-background/90 backdrop-blur flex items-center justify-center hover:scale-110 transition-transform"
                  aria-label="Wishlist"
                >
                  <Heart
                    className={`w-6 h-6 transition-colors ${
                      saved ? "fill-red-500 text-red-500" : "text-foreground"
                    }`}
                  />
                </button>
              </div>

              {productImages.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {productImages.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setActiveImage(image)}
                      className={`relative aspect-square overflow-hidden border bg-neutral-900 transition-all ${
                        selectedImage === image
                          ? "border-foreground"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} thumbnail`}
                        fill
                        className="object-cover"
                      />
                      <span className="absolute left-2 top-2 bg-black/70 px-2 py-1 text-[10px] font-black text-white">
                        0{index + 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="product-info-panel flex flex-col border border-white/10 bg-white/[0.035] p-5 sm:p-7 backdrop-blur">
              <div className="mb-6">
                <p className="inline-flex border border-white/15 bg-white/5 px-3 py-2 text-xs tracking-[0.28em] text-white/55 mb-4">
                  {product.description}
                </p>

                <h1 className="text-4xl sm:text-5xl font-black tracking-normal leading-[0.95] mb-5">
                  {product.name}
                </h1>

                <div className="flex items-end gap-3 flex-wrap">
                  <p className="text-4xl sm:text-5xl font-black text-accent leading-none">
                    ₹{product.price}
                  </p>

                  {displayMrp && (
                    <p className="relative inline-block text-base sm:text-lg text-muted-foreground pb-1">
                      <span className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 bg-white z-10" />
                      MRP ₹{displayMrp}
                    </p>
                  )}

                  {discountPercent > 0 && (
                    <p className="pb-1 text-sm sm:text-base font-black text-green-400">
                      {discountPercent}% OFF
                    </p>
                  )}
                </div>

                {lowStock && (
                  <p className="mt-3 text-sm font-bold text-yellow-400">
                    Only few drops left. This drop may sell out soon.
                  </p>
                )}
              </div>

              <p className="text-muted-foreground leading-relaxed mb-8">
                {product.longDescription}
              </p>

              <div className="product-control-box border border-border bg-secondary/20 p-4 mb-6">
                <p className="text-sm font-black mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  HAVE A COUPON?
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    className="flex-1 bg-background border border-border px-4 py-3 outline-none focus:border-foreground text-white"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => applyCoupon()}
                    className="bg-foreground text-background px-5 py-3 text-sm font-black"
                  >
                    CHECK
                  </button>
                </div>

                {couponMessage && (
                  <p className="text-xs text-muted-foreground mt-3">
                    {couponMessage}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">COLOR</span>
                  <span className="text-sm text-muted-foreground">
                    {product.color}
                  </span>
                </div>

                <div className="flex gap-3">
                  <div
                    className="w-10 h-10 rounded-full border-2 border-accent flex items-center justify-center"
                    style={{ backgroundColor: product.colorHex }}
                  >
                    <Check
                      className={`w-4 h-4 ${
                        product.color === "White" || product.color === "Beige"
                          ? "text-black"
                          : "text-white"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">SIZE</span>
                  <button className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
                    Size Guide
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const availableStock = getSizeStock(inventoryProduct, size)
                    const soldOut = availableStock <= 0

                    return (
                      <button
                        key={size}
                        onClick={() => {
                          if (!soldOut) setSelectedSize(size)
                        }}
                        disabled={soldOut}
                        className={`relative min-w-[60px] h-12 px-6 border text-sm font-medium transition-all ${
                          soldOut
                            ? "border-border text-muted-foreground opacity-40 cursor-not-allowed"
                            : selectedSize === size
                            ? "border-accent bg-accent text-background"
                            : "border-border hover:border-foreground"
                        }`}
                      >
                        {size}
                        {soldOut && (
                          <span className="absolute left-2 right-2 top-1/2 h-px -translate-y-1/2 bg-muted-foreground" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {selectedSize && getSizeStock(inventoryProduct, selectedSize) <= 5 && (
                  <p className="text-sm text-yellow-400 mt-2">
                    Only {getSizeStock(inventoryProduct, selectedSize)} left in size {selectedSize}
                  </p>
                )}

                {!selectedSize && (
                  <p className="text-sm text-red-500 mt-2">
                    Please select a size
                  </p>
                )}
              </div>

              {inventoryProduct.inStock ? (
                <>
                  <div className="mb-8">
                    <span className="text-sm font-medium block mb-3">
                      QUANTITY
                    </span>

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
                        disabled={
                          quantity >=
                          Math.min(10, selectedSize ? getSizeStock(inventoryProduct, selectedSize) : 10)
                        }
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

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

                  <button
                    onClick={handleBuyNow}
                    className="w-full py-4 border border-foreground text-center font-medium text-sm tracking-wide hover:bg-foreground hover:text-background transition-all mb-8 block"
                  >
                    BUY NOW
                  </button>
                </>
              ) : (
                <div className="border border-border bg-secondary/20 p-5 mb-8">
                  <button
                    disabled
                    className="w-full py-4 bg-neutral-800 text-muted-foreground font-medium text-sm tracking-wide cursor-not-allowed mb-4"
                  >
                    SOLD OUT
                  </button>

                  <p className="font-black mb-3 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    NOTIFY ME WHEN AVAILABLE
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="flex-1 bg-background border border-border px-4 py-3 outline-none focus:border-foreground text-white"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                    />

                    <button
                      type="button"
                      onClick={handleNotifyMe}
                      className="bg-foreground text-background px-5 py-3 text-sm font-black"
                    >
                      NOTIFY
                    </button>
                  </div>
                </div>
              )}

              <div className="product-control-box border border-border bg-secondary/20 p-4 mb-8">
                <p className="text-sm font-black mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  CHECK DELIVERY
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter pincode"
                    className="flex-1 bg-background border border-border px-4 py-3 outline-none focus:border-foreground text-white"
                    value={pincode}
                    onChange={(e) =>
                      setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                  />

                  <button
                    type="button"
                    onClick={checkDelivery}
                    className="bg-foreground text-background px-5 py-3 text-sm font-black"
                  >
                    CHECK
                  </button>
                </div>

                {deliveryMessage && (
                  <p className="text-xs text-muted-foreground mt-3">
                    {deliveryMessage}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 py-6 border-y border-border mb-8">
                <div className="product-promise text-center">
                  <Truck className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Free Shipping</p>
                  <p className="text-xs text-muted-foreground">Orders ₹1500+</p>
                </div>

                <div className="product-promise text-center">
                  <Shield className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Secure</p>
                  <p className="text-xs text-muted-foreground">Payment</p>
                </div>

                <div className="product-promise text-center">
                  <RotateCcw className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">3 Day</p>
                  <p className="text-xs text-muted-foreground">Returns</p>
                </div>
              </div>

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
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="w-1 h-1 rounded-full bg-accent mt-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}

                {activeTab === "care" && (
                  <ul className="space-y-2">
                    {product.care.map((instruction, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="w-1 h-1 rounded-full bg-accent mt-2 flex-shrink-0" />
                        {instruction}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <section className="relative mt-20 pt-12 border-t border-border">
            <h2 className="text-xl font-bold tracking-tight mb-8">
              YOU MAY ALSO LIKE
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => {
                const relatedSaved = isInWishlist(relatedProduct.id)
                const relatedMrp = getDisplayMrp(relatedProduct)

                return (
                  <div key={relatedProduct.id} className="product-card-pop relative group">
                    <button
                      onClick={() => {
                        if (relatedSaved) {
                          removeFromWishlist(relatedProduct.id)
                        } else {
                          addToWishlist({
                            id: relatedProduct.id,
                            name: relatedProduct.name,
                            description: relatedProduct.description,
                            price: relatedProduct.price,
                            mrp: relatedProduct.mrp,
                            image: relatedProduct.image,
                            slug: relatedProduct.slug,
                          })
                        }
                      }}
                      className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-background/90 backdrop-blur flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          relatedSaved ? "fill-red-500 text-red-500" : ""
                        }`}
                      />
                    </button>

                    <Link
                      href={`/product/${relatedProduct.slug}`}
                      className="block"
                    >
                      <div className="relative aspect-square bg-neutral-900 overflow-hidden">
                        <Image
                          src={relatedProduct.image}
                          alt={relatedProduct.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {relatedProduct.badge && (
                          <span
                            className={`absolute top-3 left-3 px-2 py-1 text-xs font-medium ${relatedProduct.badgeColor}`}
                          >
                            {relatedProduct.badge}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-medium">
                            {relatedProduct.name}
                          </h3>

                          <p className="text-xs text-muted-foreground mt-0.5">
                            {relatedProduct.color}
                          </p>
                        </div>

                        <div className="text-right whitespace-nowrap">
                          {relatedMrp && (
                            <p className="relative inline-block text-xs text-muted-foreground">
                              <span className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-white z-10" />
                              MRP ₹{relatedMrp}
                            </p>
                          )}

                          <p className="text-base font-black text-accent">
                            ₹{relatedProduct.price}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
