"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { ChevronDown, Mail, Phone, ShoppingBag, UserRound } from "lucide-react"
import { collection, doc, getDocs, updateDoc } from "firebase/firestore"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"
import { auth } from "@/lib/firebase"
import { db } from "@/lib/firebase"
import { syncUserProfile } from "@/lib/sync-user-profile"
import type { UserRole } from "@/lib/sync-user-profile"

type OrderRecord = {
  id: string
  userId?: string
  items?: Array<{
    name?: string
    image?: string
    size?: string
    quantity?: number
    price?: number
  }>
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
  payment?: {
    status?: string
  }
  status?: string
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
  role?: UserRole
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
  const [expandedBuyerKey, setExpandedBuyerKey] = useState<string | null>(null)
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null)

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

  const updateUserRole = async (user: UserRecord, role: UserRole) => {
    if (!auth.currentUser) {
      alert("Admin session expired. Please login again.")
      return
    }

    if (user.id === auth.currentUser.uid && role !== "admin") {
      const confirmed = window.confirm(
        "You are changing your own admin role. This can remove your admin access. Continue?"
      )

      if (!confirmed) return
    }

    setUpdatingRoleId(user.id)

    try {
      await updateDoc(doc(db, "users", user.id), {
        role,
        updatedAt: new Date().toISOString(),
      })
      setRegisteredUsers((current) =>
        current.map((item) => (item.id === user.id ? { ...item, role } : item))
      )
      alert(`Role updated to ${role}.`)
    } catch (error) {
      console.error("USER ROLE UPDATE ERROR:", error)
      alert("Unable to update user role.")
    } finally {
      setUpdatingRoleId(null)
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

  const signedInUsers = useMemo(
    () =>
      [...registeredUsers].sort(
        (a, b) =>
          new Date(b.lastLoginAt || b.createdAt || 0).getTime() -
          new Date(a.lastLoginAt || a.createdAt || 0).getTime()
      ),
    [registeredUsers]
  )

  const getBuyerOrders = (buyer: CustomerSummary) => {
    return orders
      .filter(
        (order) =>
          order.userId === buyer.key ||
          order.customer?.email === buyer.email ||
          order.customer?.phone === buyer.phone
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      )
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
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
                  SIGNED IN ({signedInUsers.length})
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
                {signedInUsers.length === 0 ? (
                  <div className="border border-border bg-secondary/20 p-6 text-muted-foreground">
                    No signed-in users yet.
                  </div>
                ) : (
                  signedInUsers.map((user) => (
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
                          {(buyerKeys.has(user.id) ||
                            buyerKeys.has(user.uid || "") ||
                            buyerKeys.has(user.email || "")) && (
                            <p className="mt-2 inline-block border border-green-700 px-2 py-1 text-xs font-black text-green-400">
                              ORDERED CUSTOMER
                            </p>
                          )}
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
                          <div className="mt-4">
                            <p className="mb-2 text-xs text-muted-foreground">
                              ROLE
                            </p>
                            <select
                              value={user.role || "customer"}
                              disabled={updatingRoleId === user.id}
                              onChange={(event) =>
                                updateUserRole(
                                  user,
                                  event.target.value as UserRole
                                )
                              }
                              className="w-full border border-border bg-background px-3 py-2 text-sm font-black outline-none disabled:opacity-50"
                            >
                              <option value="admin">Admin</option>
                              <option value="staff">Staff</option>
                              <option value="influencer">Influencer</option>
                              <option value="customer">Customer</option>
                            </select>
                          </div>
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

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedBuyerKey((current) =>
                              current === user.key ? null : user.key
                            )
                          }
                          className="px-4 py-3 border border-border text-sm font-black flex items-center gap-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          {user.orders} ORDER{user.orders === 1 ? "" : "S"}
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              expandedBuyerKey === user.key ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>

                      {expandedBuyerKey === user.key && (
                        <div className="mt-6 border-t border-border pt-5">
                          <h3 className="mb-4 text-sm font-black">
                            ORDER HISTORY
                          </h3>

                          <div className="space-y-4">
                            {getBuyerOrders(user).map((order) => (
                              <div
                                key={order.id}
                                className="border border-border bg-background/40 p-4"
                              >
                                <div className="grid gap-4 md:grid-cols-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      ORDER ID
                                    </p>
                                    <p className="font-black break-all">
                                      #{order.id}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      BOUGHT ON
                                    </p>
                                    <p className="font-bold">
                                      {formatDate(order.createdAt)}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      PAYMENT
                                    </p>
                                    <p className="font-bold">
                                      {order.payment?.status || "pending"}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      AMOUNT
                                    </p>
                                    <p className="font-black">
                                      Rs{" "}
                                      {Number(
                                        order.pricing?.total || 0
                                      ).toLocaleString("en-IN")}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-4 space-y-2">
                                  {order.items?.length ? (
                                    order.items.map((item, index) => (
                                      <div
                                        key={`${order.id}-${index}`}
                                        className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-sm"
                                      >
                                        <div className="flex items-center gap-3">
                                          {item.image && (
                                            <div className="relative h-14 w-12 overflow-hidden border border-border bg-secondary">
                                              <Image
                                                src={item.image}
                                                alt={item.name || "Product"}
                                                fill
                                                className="object-cover"
                                              />
                                            </div>
                                          )}
                                          <div>
                                            <p className="font-black">
                                              {item.name || "Product"}
                                            </p>
                                            <p className="text-muted-foreground">
                                              Size: {item.size || "-"} / Qty:{" "}
                                              {item.quantity || 1}
                                            </p>
                                          </div>
                                        </div>
                                        <p className="font-bold">
                                          Rs{" "}
                                          {Number(
                                            item.price || 0
                                          ).toLocaleString("en-IN")}
                                        </p>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="border-t border-border pt-3 text-sm text-muted-foreground">
                                      Product details were not saved on this
                                      older order.
                                    </div>
                                  )}
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                  <span className="border border-border px-3 py-1 text-muted-foreground">
                                    Order status: {order.status || "pending"}
                                  </span>
                                  <span className="border border-border px-3 py-1 text-muted-foreground">
                                    Payment status:{" "}
                                    {order.payment?.status || "pending"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
