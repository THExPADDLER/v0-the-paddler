import { TicketPercent, IndianRupee, Users, RotateCcw } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"

const coupons = [
  {
    code: "ANAYA10",
    influencer: "Anaya",
    discount: "10%",
    totalUses: 42,
    successfulOrders: 36,
    refundedOrders: 6,
    revenue: 50364,
    commissionPerOrder: 100,
  },
  {
    code: "ZOE10",
    influencer: "Zoe",
    discount: "10%",
    totalUses: 25,
    successfulOrders: 22,
    refundedOrders: 3,
    revenue: 30778,
    commissionPerOrder: 100,
  },
]

export default function AdminCouponsPage() {
  return (
    <ProtectedRoute adminOnly>
      <>
        <Header />

      <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
            INFLUENCER COUPON CONTROL
          </p>

          <div className="flex items-center justify-between mb-10">
            <h1 className="text-4xl font-black">COUPONS</h1>

            <button className="bg-foreground text-background px-6 py-3 font-black">
              CREATE COUPON
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            <div className="border border-border bg-secondary/20 p-6">
              <TicketPercent className="w-6 h-6 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Total Uses</p>
              <h2 className="text-3xl font-black mt-2">67</h2>
            </div>

            <div className="border border-border bg-secondary/20 p-6">
              <Users className="w-6 h-6 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Successful Orders</p>
              <h2 className="text-3xl font-black mt-2">58</h2>
            </div>

            <div className="border border-border bg-secondary/20 p-6">
              <RotateCcw className="w-6 h-6 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Refunded Orders</p>
              <h2 className="text-3xl font-black mt-2">9</h2>
            </div>

            <div className="border border-border bg-secondary/20 p-6">
              <IndianRupee className="w-6 h-6 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Commission Payable</p>
              <h2 className="text-3xl font-black mt-2">₹5,800</h2>
            </div>
          </div>

          <div className="space-y-5">
            {coupons.map((coupon) => {
              const commissionPayable =
                coupon.successfulOrders * coupon.commissionPerOrder

              return (
                <div
                  key={coupon.code}
                  className="border border-border bg-secondary/20 p-6"
                >
                  <div className="grid lg:grid-cols-7 gap-6 items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">COUPON</p>
                      <h2 className="text-xl font-black">{coupon.code}</h2>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        INFLUENCER
                      </p>
                      <p className="font-black">{coupon.influencer}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">DISCOUNT</p>
                      <p className="font-black">{coupon.discount}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        TOTAL USES
                      </p>
                      <p className="font-black">{coupon.totalUses}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        SUCCESSFUL
                      </p>
                      <p className="font-black text-green-400">
                        {coupon.successfulOrders}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">REFUNDED</p>
                      <p className="font-black text-red-400">
                        {coupon.refundedOrders}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        COMMISSION
                      </p>
                      <p className="font-black">₹{commissionPayable}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-border flex flex-wrap gap-3">
                    <button className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary">
                      EDIT
                    </button>

                    <button className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary">
                      VIEW ORDERS
                    </button>

                    <button className="px-4 py-3 border border-border text-sm font-black text-red-400 hover:bg-secondary">
                      DISABLE
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