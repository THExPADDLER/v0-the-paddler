"use client"

import { useState } from "react"
import { doc, setDoc } from "firebase/firestore"
import { Save } from "lucide-react"

import { db } from "@/lib/firebase"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"

export default function AddProductPage() {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [mrp, setMrp] = useState("")
  const [price, setPrice] = useState("")
  const [image, setImage] = useState("")
  const [color, setColor] = useState("")
  const [colorHex, setColorHex] = useState("#000000")
  const [description, setDescription] = useState("")
  const [longDescription, setLongDescription] = useState("")
  const [stock, setStock] = useState("20")
  const [loading, setLoading] = useState(false)

  const mrpNumber = Number(mrp)
  const priceNumber = Number(price)

  const discountPercent =
    mrpNumber > 0 && priceNumber > 0 && mrpNumber > priceNumber
      ? Math.round(((mrpNumber - priceNumber) / mrpNumber) * 100)
      : 0

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mrpNumber < priceNumber) {
      alert("MRP cannot be less than selling price.")
      return
    }

    setLoading(true)

    try {
      await setDoc(doc(db, "products", slug), {
        id: Date.now(),
        slug,
        name,
        description,
        longDescription,

        mrp: mrpNumber,
        price: priceNumber,
        discountPercent,

        image,
        images: [image],
        badge: discountPercent > 0 ? `${discountPercent}% OFF` : "NEW ARRIVAL",
        badgeColor:
          discountPercent > 0
            ? "bg-green-600 text-white"
            : "bg-foreground text-background",
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
        inStock: Number(stock) > 0,
        stock: Number(stock),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      alert("Product added successfully!")

      setName("")
      setSlug("")
      setMrp("")
      setPrice("")
      setImage("")
      setColor("")
      setColorHex("#000000")
      setDescription("")
      setLongDescription("")
      setStock("20")
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

              <input
                placeholder="Image path e.g. /images/products/new-tee.jpg"
                className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                required
              />

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

              <input
                type="number"
                placeholder="Stock"
                className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />

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