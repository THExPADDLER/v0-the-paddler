"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import { ImagePlus, Save, X } from "lucide-react"

import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/protected-route"
import { db, storage } from "@/lib/firebase"
import { getProductBySlug, type Product } from "@/lib/products"

type BadgeOption = "new-arrival" | "bestseller" | "none"

const badgeOptions: Record<BadgeOption, { label: string | null; color: string | null }> = {
  "new-arrival": {
    label: "NEW ARRIVAL",
    color: "bg-foreground text-background",
  },
  bestseller: {
    label: "BESTSELLER",
    color: "bg-accent text-background",
  },
  none: {
    label: null,
    color: null,
  },
}

const getBadgeOption = (badge: string | null | undefined): BadgeOption => {
  if (badge === "BESTSELLER") return "bestseller"
  if (badge === "NEW ARRIVAL") return "new-arrival"
  return "none"
}

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [originalProduct, setOriginalProduct] = useState<Product | null>(null)
  const [name, setName] = useState("")
  const [mrp, setMrp] = useState("")
  const [price, setPrice] = useState("")
  const [image, setImage] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [color, setColor] = useState("")
  const [colorHex, setColorHex] = useState("#000000")
  const [badge, setBadge] = useState<BadgeOption>("new-arrival")
  const [description, setDescription] = useState("")
  const [longDescription, setLongDescription] = useState("")
  const [stock, setStock] = useState("20")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const mrpNumber = Number(mrp)
  const priceNumber = Number(price)
  const discountPercent =
    mrpNumber > 0 && priceNumber > 0 && mrpNumber > priceNumber
      ? Math.round(((mrpNumber - priceNumber) / mrpNumber) * 100)
      : 0

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)

        const snapshot = await getDoc(doc(db, "products", slug))
        const product = snapshot.exists()
          ? (snapshot.data() as Product)
          : getProductBySlug(slug)

        if (!product) {
          return
        }

        setOriginalProduct(product)
        setName(product.name)
        setMrp(String(product.mrp || ""))
        setPrice(String(product.price || ""))
        setImage(product.image)
        setColor(product.color)
        setColorHex(product.colorHex || "#000000")
        setBadge(getBadgeOption(product.badge))
        setDescription(product.description)
        setLongDescription(product.longDescription)
        setStock(String(product.stock ?? (product.inStock ? 20 : 0)))
      } catch (error) {
        console.error("EDIT PRODUCT FETCH ERROR:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [slug])

  const handleImageSelect = (file: File | null) => {
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB.")
      return
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }

    setImageFile(null)
    setImage("")
    setImagePreview("")
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!originalProduct) return

    if (mrpNumber < priceNumber) {
      alert("MRP cannot be less than selling price.")
      return
    }

    setSaving(true)

    try {
      const selectedBadge = badgeOptions[badge]
      let imageUrl = image

      if (imageFile) {
        const extension = imageFile.name.split(".").pop()?.toLowerCase() || "jpg"
        const imageRef = ref(storage, `products/${slug}-${Date.now()}.${extension}`)

        await uploadBytes(imageRef, imageFile, {
          contentType: imageFile.type,
        })

        imageUrl = await getDownloadURL(imageRef)
      }

      if (!imageUrl) {
        alert("Please upload a product image.")
        return
      }

      await setDoc(
        doc(db, "products", slug),
        {
          ...originalProduct,
          slug,
          name,
          description,
          longDescription,
          mrp: mrpNumber,
          price: priceNumber,
          discountPercent,
          image: imageUrl,
          images: [imageUrl],
          badge: selectedBadge.label,
          badgeColor: selectedBadge.color,
          sizes: originalProduct.sizes?.length ? originalProduct.sizes : ["S", "M", "L"],
          color,
          colorHex,
          details: originalProduct.details?.length
            ? originalProduct.details
            : [
                "240 GSM premium heavyweight cotton",
                "Oversized drop-shoulder fit",
                "Ribbed crew neckline",
                "Made in India",
              ],
          care: originalProduct.care?.length
            ? originalProduct.care
            : [
                "Machine wash cold with like colors",
                "Do not bleach",
                "Iron inside out on low heat",
              ],
          inStock: Number(stock) > 0,
          stock: Number(stock),
          createdAt:
            (originalProduct as Product & { createdAt?: string }).createdAt ||
            new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )

      alert("Product updated successfully.")
      router.push("/admin/products")
    } catch (error) {
      console.error("EDIT PRODUCT SAVE ERROR:", error)
      alert("Failed to update product.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute adminOnly>
      <>
        <Header />

        <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
          <div className="max-w-4xl mx-auto px-4">
            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              PRODUCT CONTROL
            </p>

            <h1 className="text-4xl font-black mb-10">EDIT PRODUCT</h1>

            {loading ? (
              <div className="border border-border bg-secondary/20 p-8 text-muted-foreground">
                Loading product...
              </div>
            ) : !originalProduct ? (
              <div className="border border-border bg-secondary/20 p-8">
                <h2 className="text-2xl font-black mb-3">PRODUCT NOT FOUND</h2>
                <button
                  type="button"
                  onClick={() => router.push("/admin/products")}
                  className="bg-foreground text-background px-5 py-3 text-sm font-black"
                >
                  BACK TO PRODUCTS
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSave}
                className="border border-border bg-secondary/20 p-6 sm:p-8 space-y-5"
              >
                <input
                  placeholder="Product Name"
                  className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />

                <input
                  className="w-full bg-background border border-border px-4 py-4 outline-none text-muted-foreground"
                  value={slug}
                  disabled
                  aria-label="Slug"
                />

                <div className="grid sm:grid-cols-2 gap-5">
                  <input
                    type="number"
                    placeholder="MRP e.g. 1999"
                    className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                    value={mrp}
                    onChange={(event) => setMrp(event.target.value)}
                    required
                  />

                  <input
                    type="number"
                    placeholder="Selling Price e.g. 999"
                    className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    required
                  />
                </div>

                <div className="border border-border bg-background p-5">
                  <p className="text-xs tracking-[0.3em] text-muted-foreground mb-3">
                    PRICE PREVIEW
                  </p>

                  <div className="flex items-end gap-3 flex-wrap">
                    <span className="text-3xl font-black text-white">
                      Rs {price || "999"}
                    </span>

                    <span className="text-sm text-muted-foreground line-through pb-1">
                      Rs {mrp || "1999"}
                    </span>

                    {discountPercent > 0 && (
                      <span className="text-sm font-black text-green-400 pb-1">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>
                </div>

                <div className="border border-border bg-background p-5">
                  <p className="text-xs tracking-[0.3em] text-muted-foreground mb-4">
                    PRODUCT IMAGE
                  </p>

                  {imagePreview || image ? (
                    <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
                      <div className="relative h-52 w-40 overflow-hidden bg-neutral-900 border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview || image}
                          alt="Product preview"
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-4">
                          Current image is shown here. Upload another file to replace it.
                        </p>

                        <div className="flex flex-wrap gap-3">
                          <label className="cursor-pointer border border-border px-5 py-3 text-sm font-black hover:bg-secondary">
                            CHANGE IMAGE
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) =>
                                handleImageSelect(event.target.files?.[0] || null)
                              }
                            />
                          </label>

                          <button
                            type="button"
                            onClick={clearImage}
                            className="border border-border px-5 py-3 text-sm font-black text-red-400 hover:bg-secondary flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            REMOVE
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="flex min-h-52 cursor-pointer flex-col items-center justify-center border border-dashed border-border bg-secondary/20 px-5 py-8 text-center hover:bg-secondary/40">
                      <ImagePlus className="mb-4 h-10 w-10 text-muted-foreground" />
                      <span className="text-sm font-black text-foreground">
                        UPLOAD PRODUCT IMAGE
                      </span>
                      <span className="mt-2 text-sm text-muted-foreground">
                        JPG, PNG or WebP under 5MB
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) =>
                          handleImageSelect(event.target.files?.[0] || null)
                        }
                      />
                    </label>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <input
                    placeholder="Color e.g. Black"
                    className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    required
                  />

                  <input
                    type="color"
                    className="w-full h-14 bg-background border border-border px-4"
                    value={colorHex}
                    onChange={(event) => setColorHex(event.target.value)}
                  />
                </div>

                <select
                  value={badge}
                  onChange={(event) => setBadge(event.target.value as BadgeOption)}
                  className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                >
                  <option value="new-arrival">Badge: New Arrival</option>
                  <option value="bestseller">Badge: Best Seller</option>
                  <option value="none">Badge: No Badge</option>
                </select>

                <input
                  placeholder="Short Description e.g. OVERSIZED FIT"
                  className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                />

                <textarea
                  placeholder="Long Description"
                  className="w-full min-h-32 bg-background border border-border px-4 py-4 outline-none text-white resize-none"
                  value={longDescription}
                  onChange={(event) => setLongDescription(event.target.value)}
                  required
                />

                <input
                  type="number"
                  placeholder="Stock"
                  className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                  value={stock}
                  onChange={(event) => setStock(event.target.value)}
                  required
                />

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-foreground text-background py-4 font-black flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "SAVING..." : "SAVE CHANGES"}
                </button>
              </form>
            )}
          </div>
        </main>

        <Footer />
      </>
    </ProtectedRoute>
  )
}
