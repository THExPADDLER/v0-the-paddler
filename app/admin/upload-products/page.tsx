"use client"

import { useState } from "react"
import { collection, doc, setDoc } from "firebase/firestore"
import { Upload } from "lucide-react"

import { db } from "@/lib/firebase"
import { products } from "@/lib/products"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"

export default function UploadProductsPage() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const uploadProducts = async () => {
    setLoading(true)
    setDone(false)

    try {
      for (const product of products) {
        await setDoc(doc(collection(db, "products"), product.slug), {
          ...product,
          stock: 20,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }

      setDone(true)
      alert("Products uploaded to Firestore successfully!")
    } catch (error) {
      console.error(error)
      alert("Upload failed. Check console.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute adminOnly>
      <>
        <Header />

        <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
          <div className="max-w-3xl mx-auto px-4">
            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              FIRESTORE SETUP
            </p>

            <h1 className="text-4xl font-black mb-6">
              UPLOAD PRODUCTS
            </h1>

            <p className="text-muted-foreground mb-10">
              This will upload all current hardcoded products from{" "}
              <span className="text-foreground font-bold">lib/products.ts</span>{" "}
              into Firebase Firestore collection{" "}
              <span className="text-foreground font-bold">products</span>.
            </p>

            <button
              onClick={uploadProducts}
              disabled={loading}
              className="w-full bg-foreground text-background py-4 font-black flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Upload className="w-4 h-4" />
              {loading ? "UPLOADING..." : "UPLOAD PRODUCTS TO FIRESTORE"}
            </button>

            {done && (
              <p className="text-green-400 font-bold mt-6">
                Products uploaded successfully.
              </p>
            )}
          </div>
        </main>

        <Footer />
      </>
    </ProtectedRoute>
  )
}