import Image from "next/image"
import { Package, Truck, CheckCircle2, Clock3 } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"

const demoOrders = [
  {
    id: "TP1024",
    customer: "Vivek Patil",
    phone: "9399255433",
    product: "SKULL ART TEE",
    image: "/images/products/black-tee-3.jpg",
    size: "L",
    amount: 1399,
    payment: "Paid",
    status: "In Transit",
    tracking: "SR123456789IN",
  },
]

export default function AdminOrdersPage() {
  return (
    <ProtectedRoute adminOnly>
    <>
      <Header />

      <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
            ORDER CONTROL
          </p>

          <h1 className="text-4xl font-black mb-10">ORDERS</h1>

          <div className="space-y-6">
            {demoOrders.map((order) => (
              <div key={order.id} className="border border-border bg-secondary/20 p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="relative w-24 h-28 bg-neutral-900 overflow-hidden">
                    <Image src={order.image} alt={order.product} fill className="object-cover" />
                  </div>

                  <div className="flex-1 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground">ORDER ID</p>
                      <h2 className="font-black">#{order.id}</h2>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">CUSTOMER</p>
                      <h2 className="font-black">{order.customer}</h2>
                      <p className="text-sm text-muted-foreground">{order.phone}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">PRODUCT</p>
                      <h2 className="font-black">{order.product}</h2>
                      <p className="text-sm text-muted-foreground">Size: {order.size}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">AMOUNT</p>
                      <h2 className="font-black">₹{order.amount}</h2>
                      <p className="text-sm text-green-400">{order.payment}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-border pt-6 grid lg:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">STATUS</p>
                    <p className="font-black text-yellow-400">{order.status}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">TRACKING ID</p>
                    <p className="font-black">{order.tracking}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary flex items-center gap-2">
                      <Clock3 className="w-4 h-4" />
                      Processing
                    </button>

                    <button className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Shipped
                    </button>

                    <button className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Transit
                    </button>

                    <button className="px-4 py-3 bg-foreground text-background text-sm font-black hover:bg-foreground/90 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Delivered
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
    </ProtectedRoute>
  )
}