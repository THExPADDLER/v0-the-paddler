"use client"

import { useEffect, useMemo, useState } from "react"
import { BadgePercent, IndianRupee, ShoppingBag, TicketPercent } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { collection, getDocs } from "firebase/firestore"

import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/protected-route"
import { db } from "@/lib/firebase"

type Coupon = {
  code: string
  influencer?: string
  commissionPerOrder?: number
  discountPercent?: number
  active?: boolean
}

type OrderRecord = {
  id: string
  items?: Array<{
    name?: string
    quantity?: number
    qty?: number
  }>
  customer?: {
    name?: string
    email?: string
  }
  pricing?: {
    total?: number
    couponCode?: string | null
  }
  payment?: {
    status?: string
  }
  createdAt?: string
}

type CurrentUser = {
  name?: string
  email?: string
  role?: string
}

const isPaidOrder = (order: OrderRecord) => {
  const paymentStatus = order.payment?.status?.toLowerCase()
  return (
    paymentStatus === "success" ||
    paymentStatus === "completed" ||
    paymentStatus === "paid"
  )
}

const normalized = (value?: string) => value?.trim().toLowerCase() || ""

export default function InfluencerDashboardPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (!stored) return

    try {
      setCurrentUser(JSON.parse(stored) as CurrentUser)
    } catch {
      setCurrentUser(null)
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [couponSnap, orderSnap] = await Promise.all([
          getDocs(collection(db, "coupons")),
          getDocs(collection(db, "orders")),
        ])

        setCoupons(
          couponSnap.docs.map((item) => ({
            code: item.id,
            ...(item.data() as Omit<Coupon, "code">),
          }))
        )
        setOrders(
          orderSnap.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<OrderRecord, "id">),
          }))
        )
      } catch (error) {
        console.error("INFLUENCER DASHBOARD FETCH ERROR:", error)
        setCoupons([])
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const influencerCoupons = useMemo(() => {
    const name = normalized(currentUser?.name)
    const email = normalized(currentUser?.email)

    if (!name && !email) return []

    return coupons.filter((coupon) => {
      const source = normalized(coupon.influencer)
      return source === name || source === email
    })
  }, [coupons, currentUser?.email, currentUser?.name])

  const couponStats = useMemo(() => {
    return influencerCoupons.map((coupon) => {
      const couponOrders = orders.filter(
        (order) =>
          normalized(order.pricing?.couponCode || "") === normalized(coupon.code)
      )
      const paidOrders = couponOrders.filter(isPaidOrder)
      const soldTees = paidOrders.reduce((total, order) => {
        const quantity = order.items?.reduce(
          (sum, item) => sum + Number(item.quantity || item.qty || 1),
          0
        )
        return total + Number(quantity || 1)
      }, 0)

      return {
        ...coupon,
        totalUses: couponOrders.length,
        paidOrders: paidOrders.length,
        soldTees,
        commission:
          paidOrders.length * Number(coupon.commissionPerOrder || 0),
        revenue: paidOrders.reduce(
          (sum, order) => sum + Number(order.pricing?.total || 0),
          0
        ),
      }
    })
  }, [influencerCoupons, orders])

  const summary = couponStats.reduce(
    (total, coupon) => ({
      uses: total.uses + coupon.totalUses,
      soldTees: total.soldTees + coupon.soldTees,
      commission: total.commission + coupon.commission,
      revenue: total.revenue + coupon.revenue,
    }),
    { uses: 0, soldTees: 0, commission: 0, revenue: 0 }
  )
  const summaryCards: Array<{
    label: string
    value: string | number
    icon: LucideIcon
  }> = [
    { label: "Coupon Uses", value: summary.uses, icon: TicketPercent },
    { label: "Sold T-Shirts", value: summary.soldTees, icon: ShoppingBag },
    {
      label: "Commission",
      value: `Rs ${summary.commission.toLocaleString("en-IN")}`,
      icon: IndianRupee,
    },
    {
      label: "Revenue",
      value: `Rs ${summary.revenue.toLocaleString("en-IN")}`,
      icon: BadgePercent,
    },
  ]

  return (
    <ProtectedRoute allowedRoles={["admin", "influencer"]}>
      <>
        <Header />

        <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
          <div className="mx-auto max-w-6xl px-4">
            <p className="mb-3 text-xs tracking-[0.35em] text-muted-foreground">
              INFLUENCER CONTROL
            </p>
            <h1 className="mb-8 text-4xl font-black">COUPON PERFORMANCE</h1>

            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {summaryCards.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="border border-border bg-secondary/20 p-5"
                >
                  <Icon className="mb-4 h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-black">{value}</p>
                </div>
              ))}
            </div>

            <div className="border border-border bg-secondary/20 p-5">
              {loading ? (
                <p className="text-muted-foreground">Loading coupon data...</p>
              ) : couponStats.length === 0 ? (
                <p className="text-muted-foreground">
                  No coupon is linked to this influencer yet. Ask admin to set
                  the coupon influencer/source exactly as your name or email.
                </p>
              ) : (
                <div className="space-y-4">
                  {couponStats.map((coupon) => (
                    <div
                      key={coupon.code}
                      className="grid gap-4 border border-border bg-background p-4 md:grid-cols-5"
                    >
                      <div>
                        <p className="text-xs text-muted-foreground">COUPON</p>
                        <p className="font-black">{coupon.code}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">USED</p>
                        <p className="font-black">{coupon.totalUses}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          SOLD TEES
                        </p>
                        <p className="font-black">{coupon.soldTees}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          COMMISSION
                        </p>
                        <p className="font-black">
                          Rs {coupon.commission.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">REVENUE</p>
                        <p className="font-black">
                          Rs {coupon.revenue.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </>
    </ProtectedRoute>
  )
}
