"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { AlertTriangle, Edit, PackagePlus, Trash2 } from "lucide-react"
import { collection, deleteDoc, doc, getDocs, orderBy, query } from "firebase/firestore"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"
import { db } from "@/lib/firebase"
import { products as localProducts, type Product } from "@/lib/products"

type AdminProduct = Product & {
  stock?: number
  source: "firestore" | "local"
}

const normalizeProduct = (
  product: Product & { stock?: number },
  source: AdminProduct["source"]
): AdminProduct => {
  return {
    ...product,
    source,
    stock:
      typeof product.stock === "number"
        ? product.stock
        : product.inStock
        ? 20
        : 0,
    images: product.images?.length ? product.images : [product.image],
    mrp: product.mrp && product.mrp > product.price ? product.mrp : undefined,
  }
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>(
    localProducts.map((product) => normalizeProduct(product, "local"))
  )
  const [loading, setLoading] = useState(true)

  const fetchProducts = async () => {
    try {
      setLoading(true)

      const productsQuery = query(
        collection(db, "products"),
        orderBy("createdAt", "desc")
      )
      const snapshot = await getDocs(productsQuery)

      if (snapshot.empty) {
        setProducts(localProducts.map((product) => normalizeProduct(product, "local")))
        return
      }

      setProducts(
        snapshot.docs.map((item) =>
          normalizeProduct(item.data() as Product & { stock?: number }, "firestore")
        )
      )
    } catch (error) {
      console.error("ADMIN PRODUCTS FETCH ERROR:", error)
      setProducts(localProducts.map((product) => normalizeProduct(product, "local")))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleDelete = async (product: AdminProduct) => {
    if (product.source !== "firestore") {
      alert("Local demo products cannot be deleted from Firestore.")
      return
    }

    const confirmed = window.confirm(`Delete ${product.name}?`)

    if (!confirmed) return

    await deleteDoc(doc(db, "products", product.slug))
    await fetchProducts()
  }

  return (
    <ProtectedRoute adminOnly>
      <>
        <Header />

        <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              PRODUCT CONTROL
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-10">
              <div>
                <h1 className="text-4xl font-black">PRODUCTS</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  {loading ? "Loading products..." : `${products.length} products loaded`}
                </p>
              </div>

              <Link
                href="/admin/add-product"
                className="bg-foreground text-background px-6 py-3 font-black flex items-center justify-center gap-2"
              >
                <PackagePlus className="w-4 h-4" />
                ADD PRODUCT
              </Link>
            </div>

            <div className="border border-border bg-secondary/20 overflow-x-auto">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-[90px_1fr_160px_120px_140px_120px] gap-4 px-5 py-4 border-b border-border text-xs font-black text-muted-foreground">
                  <span>IMAGE</span>
                  <span>PRODUCT</span>
                  <span>PRICE</span>
                  <span>STOCK</span>
                  <span>SOURCE</span>
                  <span>ACTIONS</span>
                </div>

                {products.map((product) => {
                  const stock = product.stock || 0

                  return (
                    <div
                      key={`${product.source}-${product.slug}`}
                      className="grid grid-cols-[90px_1fr_160px_120px_140px_120px] gap-4 items-center px-5 py-5 border-b border-border last:border-b-0"
                    >
                      <div className="relative w-16 h-20 bg-neutral-900 overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div>
                        <h2 className="font-black">{product.name}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          {product.color} / {product.sizes.join(" / ")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {product.slug}
                        </p>
                      </div>

                      <div>
                        {product.mrp && (
                          <p className="relative inline-block text-xs text-muted-foreground">
                            <span className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-white z-10" />
                            MRP ₹{product.mrp}
                          </p>
                        )}
                        <p className="font-black text-accent">₹{product.price}</p>
                      </div>

                      <div>
                        <p
                          className={`font-black ${
                            stock === 0
                              ? "text-red-400"
                              : stock <= 5
                              ? "text-yellow-400"
                              : "text-green-400"
                          }`}
                        >
                          {stock === 0 ? "OUT" : stock}
                        </p>

                        {stock <= 5 && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-3 h-3" />
                            Low stock
                          </p>
                        )}
                      </div>

                      <span className="w-fit px-3 py-1 text-xs font-black border border-border text-muted-foreground">
                        {product.source === "firestore" ? "FIRESTORE" : "LOCAL"}
                      </span>

                      <div className="flex gap-3">
                        <Link
                          href={`/admin/edit-product/${product.slug}`}
                          className="p-2 border border-border hover:bg-secondary"
                          aria-label="Edit product"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          className="p-2 border border-border hover:bg-secondary text-red-400 disabled:opacity-40"
                          disabled={product.source !== "firestore"}
                          aria-label="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </>
    </ProtectedRoute>
  )
}
