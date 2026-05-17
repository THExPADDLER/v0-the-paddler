import Image from "next/image"
import { PackagePlus, Edit, Trash2, AlertTriangle } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { products } from "@/lib/products"
import { ProtectedRoute } from "@/components/protected-route"

export default function AdminProductsPage() {
  return (
   <ProtectedRoute adminOnly>
    <>
      <Header />

      <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
            PRODUCT CONTROL
          </p>

          <div className="flex items-center justify-between mb-10">
            <h1 className="text-4xl font-black">PRODUCTS</h1>

            <button className="bg-foreground text-background px-6 py-3 font-black flex items-center gap-2">
              <PackagePlus className="w-4 h-4" />
              ADD PRODUCT
            </button>
          </div>

          <div className="border border-border bg-secondary/20 overflow-hidden">
            <div className="grid grid-cols-[90px_1fr_120px_120px_160px] gap-4 px-5 py-4 border-b border-border text-xs font-black text-muted-foreground">
              <span>IMAGE</span>
              <span>PRODUCT</span>
              <span>PRICE</span>
              <span>STOCK</span>
              <span>ACTIONS</span>
            </div>

            {products.map((product, index) => {
              const stock = index % 3 === 0 ? 3 : index % 4 === 0 ? 0 : 18

              return (
                <div
                  key={product.id}
                  className="grid grid-cols-[90px_1fr_120px_120px_160px] gap-4 items-center px-5 py-5 border-b border-border last:border-b-0"
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
                      {product.color} · {product.sizes.join(" / ")}
                    </p>
                  </div>

                  <p className="font-bold">₹{product.price}</p>

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

                  <div className="flex gap-3">
                    <button className="p-2 border border-border hover:bg-secondary">
                      <Edit className="w-4 h-4" />
                    </button>

                    <button className="p-2 border border-border hover:bg-secondary text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      <Footer />
    </>
    </ProtectedRoute>
  )
}