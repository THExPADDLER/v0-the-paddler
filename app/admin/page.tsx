import Link from "next/link"
import {
  Package,
  Users,
  IndianRupee,
  TicketPercent,
  Bell,
  ShoppingBag,
  RotateCcw,
  ImageIcon,
} from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"

const stats = [
  { title: "Total Orders", value: "128", icon: Package },
  { title: "Revenue", value: "₹1,84,500", icon: IndianRupee },
  { title: "Products", value: "24", icon: ShoppingBag },
  { title: "Users", value: "740", icon: Users },
  { title: "Coupons Used", value: "89", icon: TicketPercent },
  { title: "Notify Requests", value: "312", icon: Bell },
]

const links = [
  {
    title: "Products",
    href: "/admin/products",
    desc: "Add products, manage stock, mark sold out.",
    icon: ShoppingBag,
  },
  {
    title: "Orders",
    href: "/admin/orders",
    desc: "View orders, tracking, payment and delivery status.",
    icon: Package,
  },
  {
    title: "Users",
    href: "/admin/users",
    desc: "View customers, addresses and reset password.",
    icon: Users,
  },
  {
    title: "Coupons",
    href: "/admin/coupons",
    desc: "Influencer coupon usage and commission tracking.",
    icon: TicketPercent,
  },
  {
    title: "Returns",
    href: "/admin/returns",
    desc: "Approve returns and initiate Razorpay refunds.",
    icon: RotateCcw,
  },
  {
    title: "Banner Control",
    href: "/admin/banner",
    desc: "Manage homepage banners, countdown and announcements.",
    icon: ImageIcon,
  },
]

export default function AdminPage() {
  return (
    <ProtectedRoute adminOnly>
      <>
        <Header />

        <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              THE PADDLER CONTROL ROOM
            </p>

            <h1 className="text-4xl sm:text-5xl font-black mb-10">
              ADMIN PANEL
            </h1>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
              {stats.map((item) => {
                const Icon = item.icon

                return (
                  <div
                    key={item.title}
                    className="border border-border bg-secondary/20 p-6"
                  >
                    <Icon className="w-6 h-6 text-muted-foreground mb-5" />

                    <p className="text-sm text-muted-foreground">
                      {item.title}
                    </p>

                    <h2 className="text-3xl font-black mt-2">
                      {item.value}
                    </h2>
                  </div>
                )
              })}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {links.map((item) => {
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="border border-border bg-secondary/20 p-6 hover:bg-secondary transition-colors group"
                  >
                    <Icon className="w-6 h-6 text-muted-foreground mb-5 group-hover:text-foreground transition-colors" />

                    <h2 className="text-xl font-black mb-2">
                      {item.title}
                    </h2>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </Link>
                )
              })}
            </div>

            <div className="mt-12 border border-border bg-secondary/20 p-6">
              <h2 className="text-2xl font-black mb-4">
                BACKEND STATUS
              </h2>

              <p className="text-muted-foreground leading-relaxed">
                Firebase setup is in progress. This dashboard UI is ready. Next,
                we will connect products, users, orders, coupons, returns,
                banners, and notify-me requests with Firestore database.
              </p>
            </div>
          </div>
        </main>

        <Footer />
      </>
    </ProtectedRoute>
  )
}