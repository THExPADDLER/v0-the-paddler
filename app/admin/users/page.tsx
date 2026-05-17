import { Mail, Trash2, KeyRound, ShoppingBag } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"

const users = [
  {
    name: "Vivek Patil",
    email: "vivek@example.com",
    phone: "9399255433",
    address: "Lalbagh, Burhanpur, Madhya Pradesh - 450331",
    orders: 4,
    joined: "May 2026",
  },
  {
    name: "Anaya",
    email: "anaya@example.com",
    phone: "9000000000",
    address: "Lalghati, Bhopal, Madhya Pradesh - 462038",
    orders: 2,
    joined: "May 2026",
  },
]

export default function AdminUsersPage() {
  return (
    <ProtectedRoute adminOnly>
      <>
        <Header />

        <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              CUSTOMER CONTROL
            </p>

            <h1 className="text-4xl font-black mb-10">USERS</h1>

            <div className="space-y-5">
              {users.map((user) => (
                <div
                  key={user.email}
                  className="border border-border bg-secondary/20 p-6"
                >
                  <div className="grid lg:grid-cols-6 gap-6 items-start">
                    <div>
                      <p className="text-xs text-muted-foreground">NAME</p>
                      <h2 className="font-black">{user.name}</h2>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">EMAIL</p>
                      <p className="font-bold break-all">{user.email}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">PHONE</p>
                      <p className="font-bold">{user.phone}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">ADDRESS</p>
                      <p className="font-bold text-sm leading-relaxed">
                        {user.address}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">ORDERS</p>
                      <p className="font-black">{user.orders}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">JOINED</p>
                      <p className="font-bold">{user.joined}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-border flex flex-wrap gap-3">
                    <button className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      VIEW ORDERS
                    </button>

                    <button className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      EMAIL USER
                    </button>

                    <button className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary flex items-center gap-2">
                      <KeyRound className="w-4 h-4" />
                      SEND RESET LINK
                    </button>

                    <button className="px-4 py-3 border border-border text-sm font-black text-red-400 hover:bg-secondary flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      DELETE USER
                    </button>
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