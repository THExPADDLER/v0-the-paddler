"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Mail, Phone, ShoppingBag, UserRound } from "lucide-react"
import { collection, getDocs } from "firebase/firestore"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"
import { auth } from "@/lib/firebase"
import { db } from "@/lib/firebase"
import { syncUserProfile } from "@/lib/sync-user-profile"

type OrderRecord = {
  id: string
  userId?: string
  customer?: {
    name?: string
    email?: string
    phone?: string
  }
  address?: {
    address?: string
    landmark?: string
    city?: string
    state?: string
    pincode?: string
  }
  pricing?: {
    total?: number
  }
  createdAt?: string
}

type UserRecord = {
  id: string
  uid?: string
  name?: string
  email?: string
  phone?: string
  photoURL?: string
  providerIds?: string[]
  createdAt?: string
  lastLoginAt?: string
}

type CustomerSummary = {
  key: string
  name: string
  email: string
  phone: string
  address: string
  orders: number
  totalSpend: number
  joined: string
}

const formatDate = (value?: string) => {
  if (!value) return "Not available"

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function AdminUsersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [registeredUsers, setRegisteredUsers] = useState<UserRecord[]>([])
  const [activeTab, setActiveTab] = useState<"registered" | "buyers">(
    "registered"
  )
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const [ordersSnapshot, usersSnapshot] = await Promise.all([
        getDocs(collection(db, "orders")),
        getDocs(collection(db, "users")),
      ])

      setOrders(
        ordersSnapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<OrderRecord, "id">),
        }))
      )

      setRegisteredUsers(
        usersSnapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<UserRecord, "id">),
        }))
      )
    } catch (error) {
      console.error("ADMIN USERS FETCH ERROR:", error)
      setOrders([])
      setRegisteredUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const syncCurrentAdminProfile = async () => {
    if (!auth.currentUser) {
      alert("No logged-in Firebase user found.")
      return
    }

    setSyncing(true)

    try {
      await syncUserProfile(auth.currentUser, "admin")
      await fetchUsers()
      alert("Current admin profile synced into users collection.")
    } catch (error) {
      console.error("ADMIN USER SYNC ERROR:", error)
      alert(
        error instanceof Error
          ? error.message
          : "Unable to sync user profile. Check Firestore rules."
      )
    } finally {
      setSyncing(false)
    }
  }

  const buyers = useMemo<CustomerSummary[]>(() => {
    const map = new Map<string, CustomerSummary>()

    orders.forEach((order) => {
      const key = order.userId || order.customer?.email || order.id
      const existing = map.get(key)
      const orderDate = order.createdAt ? new Date(order.createdAt) : new Date()
      const addressParts = [
        order.address?.address,
        order.address?.landmark ? `Landmark: ${order.address.landmark}` : null,
        order.address?.city,
        order.address?.state,
        order.address?.pincode,
      ].filter(Boolean)

      if (!existing) {
        map.set(key, {
          key,
          name: order.customer?.name || "Customer",
          email: order.customer?.email || "No email",
          phone: order.customer?.phone || "No phone",
          address: addressParts.join(", ") || "No address saved",
          orders: 1,
          totalSpend: Number(order.pricing?.total || 0),
          joined: orderDate.toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
          }),
        })
        return
      }

      existing.orders += 1
      existing.totalSpend += Number(order.pricing?.total || 0)
      if (existing.address === "No address saved" && addressParts.length > 0) {
        existing.address = addressParts.join(", ")
      }
    })

    return Array.from(map.values()).sort((a, b) => b.orders - a.orders)
  }, [orders])

  const buyerKeys = useMemo(
    () => new Set(buyers.flatMap((buyer) => [buyer.key, buyer.email])),
    [buyers]
  )

  const signInOnlyUsers = useMemo(
    () =>
      registeredUsers
        .filter(
          (user) =>
            !buyerKeys.has(user.id) &&
            !buyerKeys.has(user.uid || "") &&
            !buyerKeys.has(user.email || "")
        )
        .sort(
          (a, b) =>
            new Date(b.lastLoginAt || b.createdAt || 0).getTime() -
            new Date(a.lastLoginAt || a.createdAt || 0).getTime()
        ),
    [buyerKeys, registeredUsers]
  )

  return (
    <ProtectedRoute adminOnly>
      <>
        <Header />

        <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              CUSTOMER CONTROL
            </p>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-8">
              <h1 className="text-4xl font-black">USERS</h1>

              <div className="inline-flex border border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab("registered")}
                  className={`px-5 py-3 text-sm font-black ${
                    activeTab === "registered"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  SIGNED IN ({signInOnlyUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("buyers")}
                  className={`px-5 py-3 text-sm font-black ${
                    activeTab === "buyers"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ORDERED ({buyers.length})
                </button>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={fetchUsers}
                className="border border-border px-4 py-3 text-sm font-black hover:bg-secondary"
              >
                REFRESH USERS
              </button>
              <button
                type="button"
                onClick={syncCurrentAdminProfile}
                disabled={syncing}
                className="border border-border px-4 py-3 text-sm font-black hover:bg-secondary disabled:opacity-50"
              >
                {syncing ? "SYNCING..." : "SYNC CURRENT LOGIN"}
              </button>
            </div>

            {loading ? (
              <div className="border border-border bg-secondary/20 p-6 text-muted-foreground">
                Loading users...
              </div>
            ) : activeTab === "registered" ? (
              <div className="space-y-5">
                {signInOnlyUsers.length === 0 ? (
                  <div className="border border-border bg-secondary/20 p-6 text-muted-foreground">
                    No sign-in-only users yet.
                  </div>
                ) : (
                  signInOnlyUsers.map((user) => (
                    <div
                      key={user.id}
                      className="border border-border bg-secondary/20 p-6"
                    >
                      <div className="grid gap-6 md:grid-cols-[72px_1fr_1fr_1fr] items-center">
                        <div className="relative h-16 w-16 overflow-hidden rounded-full border border-border bg-background">
                          {user.photoURL ? (
                            <Image
                              src={user.photoURL}
                              alt={user.name || "User"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <UserRound className="h-7 w-7 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">NAME</p>
                          <h2 className="font-black">
                            {user.name || "Customer"}
                          </h2>
                          <p className="text-xs text-muted-foreground mt-1">
                            {user.providerIds?.join(", ") || "Firebase Auth"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">CONTACT</p>
                          <p className="font-bold break-all flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {user.email || "No email"}
                          </p>
                          <p className="font-bold mt-2 flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {user.phone || "No phone"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            LAST LOGIN
                          </p>
                          <p className="font-bold">
                            {formatDate(user.lastLoginAt || user.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {buyers.length === 0 ? (
                  <div className="border border-border bg-secondary/20 p-6 text-muted-foreground">
                    No customer orders yet.
                  </div>
                ) : (
                  buyers.map((user) => (
                    <div
                      key={user.key}
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
                          <p className="text-xs text-muted-foreground mt-1">
                            Rs {user.totalSpend.toLocaleString("en-IN")}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">JOINED</p>
                          <p className="font-bold">{user.joined}</p>
                        </div>
                      </div>

                      <div className="mt-6 pt-5 border-t border-border flex flex-wrap gap-3">
                        <a
                          href={`mailto:${user.email}`}
                          className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary flex items-center gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          EMAIL USER
                        </a>

                        <div className="px-4 py-3 border border-border text-sm font-black flex items-center gap-2 text-muted-foreground">
                          <ShoppingBag className="w-4 h-4" />
                          {user.orders} ORDER{user.orders === 1 ? "" : "S"}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </main>

        <Footer />
      </>
    </ProtectedRoute>
  )
}
