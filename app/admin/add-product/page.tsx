"use client"

import { useState } from "react"
import { doc, setDoc } from "firebase/firestore"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import { ImagePlus, Save, X } from "lucide-react"

import { db, storage } from "@/lib/firebase"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"

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

export default function AddProductPage() {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [mrp, setMrp] = useState("")
  const [price, setPrice] = useState("")
  const [image, setImage] = useState("")
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [color, setColor] = useState("")
  const [colorHex, setColorHex] = useState("#000000")
  const [badge, setBadge] = useState<BadgeOption>("new-arrival")
  const [description, setDescription] = useState("")
  const [longDescription, setLongDescription] = useState("")
  const [sizeStock, setSizeStock] = useState({
    S: "0",
    M: "0",
    L: "0",
  })
  const [loading, setLoading] = useState(false)

  const mrpNumber = Number(mrp)
  const priceNumber = Number(price)

  const discountPercent =
    mrpNumber > 0 && priceNumber > 0 && mrpNumber > priceNumber
      ? Math.round(((mrpNumber - priceNumber) / mrpNumber) * 100)
      : 0
  const totalStock = Object.values(sizeStock).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  )

  const createSlug = (value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  const handleNameChange = (value: string) => {
    setName(value)
    setSlug(createSlug(value))
  }

  const handleImageSelect = (files: FileList | null) => {
    if (!files?.length) return

    const selectedFiles = Array.from(files).slice(0, 6)

    if (selectedFiles.some((file) => !file.type.startsWith("image/"))) {
      alert("Please upload image files only.")
      return
    }

    if (selectedFiles.some((file) => file.size > 5 * 1024 * 1024)) {
      alert("Each image must be smaller than 5MB.")
      return
    }

    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview))

    setImageFiles(selectedFiles)
    setImage("")
    setImagePreviews(selectedFiles.map((file) => URL.createObjectURL(file)))
  }

  const clearImage = () => {
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview))

    setImageFiles([])
    setImage("")
    setImagePreviews([])
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mrpNumber < priceNumber) {
      alert("MRP cannot be less than selling price.")
      return
    }

    setLoading(true)

    try {
      const selectedBadge = badgeOptions[badge]
      let imageUrl = image
      let imageUrls = image ? [image] : []

      if (imageFiles.length > 0) {
        imageUrls = []

        for (const [index, file] of imageFiles.entries()) {
          const extension = file.name.split(".").pop()?.toLowerCase() || "jpg"
          const imageRef = ref(
            storage,
            `products/${slug || createSlug(name)}-${index + 1}-${Date.now()}.${extension}`
          )

          await uploadBytes(imageRef, file, {
            contentType: file.type,
          })

          imageUrls.push(await getDownloadURL(imageRef))
        }

        imageUrl = imageUrls[0]
      }

      if (!imageUrl) {
        alert("Please upload at least one product image.")
        return
      }

      await setDoc(doc(db, "products", slug), {
        id: Date.now(),
        slug,
        name,
        description,
        longDescription,

        mrp: mrpNumber,
        price: priceNumber,
        discountPercent,

        image: imageUrl,
        images: imageUrls,
        badge: selectedBadge.label,
        badgeColor: selectedBadge.color,
        sizes: ["S", "M", "L"],
        color,
        colorHex,
        details: [
          "240 GSM premium heavyweight cotton",
          "Oversized drop-shoulder fit",
          "Ribbed crew neckline",
          "Made in India",
        ],
        care: [
          "Machine wash cold with like colors",
          "Do not bleach",
          "Iron inside out on low heat",
        ],
        inStock: totalStock > 0,
        stock: totalStock,
        stockBySize: {
          S: Number(sizeStock.S || 0),
          M: Number(sizeStock.M || 0),
          L: Number(sizeStock.L || 0),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      alert("Product added successfully!")

      setName("")
      setSlug("")
      setMrp("")
      setPrice("")
      clearImage()
      setColor("")
      setColorHex("#000000")
      setBadge("new-arrival")
      setDescription("")
      setLongDescription("")
      setSizeStock({
        S: "0",
        M: "0",
        L: "0",
      })
    } catch (error) {
      console.error(error)
      alert("Failed to add product.")
    } finally {
      setLoading(false)
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

            <h1 className="text-4xl font-black mb-10">
              ADD PRODUCT
            </h1>

            <form
              onSubmit={handleSave}
              className="border border-border bg-secondary/20 p-6 sm:p-8 space-y-5"
            >
              <input
                placeholder="Product Name"
                className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />

              <input
                placeholder="Slug"
                className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                value={slug}
                onChange={(e) => setSlug(createSlug(e.target.value))}
                required
              />

              <div className="grid sm:grid-cols-2 gap-5">
                <input
                  type="number"
                  placeholder="MRP e.g. 1999"
                  className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  required
                />

                <input
                  type="number"
                  placeholder="Selling Price e.g. 999"
                  className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="border border-border bg-background p-5">
                <p className="text-xs tracking-[0.3em] text-muted-foreground mb-3">
                  PRICE PREVIEW
                </p>

                <div className="flex items-end gap-3 flex-wrap">
                  <span className="text-3xl font-black text-white">
                    ₹{price || "999"}
                  </span>

                  <span className="text-sm text-muted-foreground line-through pb-1">
                    ₹{mrp || "1999"}
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

                {imagePreviews.length > 0 || image ? (
                  <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
                    <div className="grid grid-cols-3 gap-3">
                      {(imagePreviews.length > 0 ? imagePreviews : [image]).map(
                        (preview, index) => (
                          <div
                            key={`${preview}-${index}`}
                            className="relative h-32 w-24 overflow-hidden bg-neutral-900 border border-border"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={preview}
                              alt={`Product preview ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-4">
                        Images selected. First image becomes the main product image.
                      </p>

                      <div className="flex flex-wrap gap-3">
                        <label className="cursor-pointer border border-border px-5 py-3 text-sm font-black hover:bg-secondary">
                          CHANGE IMAGE
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(event) => handleImageSelect(event.target.files)}
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
                      Upload up to 6 JPG, PNG or WebP images under 5MB each
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      required={!image}
                      onChange={(event) => handleImageSelect(event.target.files)}
                    />
                  </label>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <input
                  placeholder="Color e.g. Black"
                  className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  required
                />

                <input
                  type="color"
                  className="w-full h-14 bg-background border border-border px-4"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
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
                onChange={(e) => setDescription(e.target.value)}
                required
              />

              <textarea
                placeholder="Long Description"
                className="w-full min-h-32 bg-background border border-border px-4 py-4 outline-none text-white resize-none"
                value={longDescription}
                onChange={(e) => setLongDescription(e.target.value)}
                required
              />

              <div className="border border-border bg-background p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <p className="text-xs tracking-[0.3em] text-muted-foreground">
                    SIZE STOCK
                  </p>
                  <p className="text-sm font-black text-accent">
                    TOTAL {totalStock}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {(["S", "M", "L"] as const).map((size) => (
                    <label key={size} className="block">
                      <span className="mb-2 block text-sm font-black">{size}</span>
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                        value={sizeStock[size]}
                        onChange={(event) =>
                          setSizeStock((current) => ({
                            ...current,
                            [size]: event.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-foreground text-background py-4 font-black flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {loading ? "SAVING..." : "SAVE PRODUCT"}
              </button>
            </form>
          </div>
        </main>

        <Footer />
      </>
    </ProtectedRoute>
  )
}
