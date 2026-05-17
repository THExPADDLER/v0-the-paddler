import Image from "next/image"
import { CheckCircle2, Truck, XCircle, RotateCcw } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"

const returns = [
  {
    id: "RET-1001",
    orderId: "TP1024",
    customer: "Vivek Patil",
    product: "SKULL ART TEE",
    image: "/images/products/black-tee-3.jpg",
    reason: "Size issue",
    status: "Return Requested",
    pickupStatus: "Pickup Pending",
    refundStatus: "Not Initiated",
    amount: 1399,
  },
]

export default function AdminReturnsPage() {
  return (
    <ProtectedRoute adminOnly>
      <>
        <Header />

      <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
            RETURNS & REFUNDS
          </p>

          <h1 className="text-4xl font-black mb-10">RETURN REQUESTS</h1>

          <div className="space-y-6">
            {returns.map((item) => (
              <div key={item.id} className="border border-border bg-secondary/20 p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="relative w-24 h-28 bg-neutral-900 overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.product}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground">RETURN ID</p>
                      <h2 className="font-black">{item.id}</h2>
                      <p className="text-sm text-muted-foreground">Order #{item.orderId}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">CUSTOMER</p>
                      <h2 className="font-black">{item.customer}</h2>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">PRODUCT</p>
                      <h2 className="font-black">{item.product}</h2>
                      <p className="text-sm text-muted-foreground">{item.reason}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">AMOUNT</p>
                      <h2 className="font-black">₹{item.amount}</h2>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-border grid md:grid-cols-3 gap-5">
                  <div>
                    <p className="text-xs text-muted-foreground">RETURN STATUS</p>
                    <p className="font-black text-yellow-400 mt-1">{item.status}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">PICKUP STATUS</p>
                    <p className="font-black mt-1">{item.pickupStatus}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">REFUND STATUS</p>
                    <p className="font-black text-red-400 mt-1">{item.refundStatus}</p>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-border flex flex-wrap gap-3">
                  <button className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    APPROVE RETURN
                  </button>

                  <button className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    MARK PICKED UP
                  </button>

                  <button className="px-4 py-3 bg-foreground text-background text-sm font-black hover:bg-foreground/90 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    INITIATE RAZORPAY REFUND
                  </button>

                  <button className="px-4 py-3 border border-border text-sm font-black text-red-400 hover:bg-secondary flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    REJECT
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mt-5">
                  Refund should be initiated only after courier pickup is confirmed.
                </p>
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