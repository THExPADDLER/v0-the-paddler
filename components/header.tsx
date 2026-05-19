"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Heart,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth"

import { auth } from "@/lib/firebase"
import { useCart } from "@/lib/cart-context"
import { useWishlist } from "@/lib/wishlist-context"
import { products } from "@/lib/products"

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [user, setUser] = useState<FirebaseUser | null>(null)

  const pathname = usePathname()
  const router = useRouter()
  const { totalItems } = useCart()
  const { totalWishlistItems } = useWishlist()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })

    return () => unsubscribe()
  }, [])

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    if (!q) return []

    return products
      .filter((product) => {
        return (
          product.name.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q) ||
          product.color.toLowerCase().includes(q)
        )
      })
      .slice(0, 6)
  }, [searchQuery])

  const handleLogout = async () => {
    await signOut(auth)
    localStorage.removeItem("user")
    setUser(null)
    setProfileOpen(false)
    router.push("/")
  }

  const handleBack = () => {
    closeAll()

    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push("/")
  }

  const closeAll = () => {
    setMenuOpen(false)
    setProfileOpen(false)
    setSearchOpen(false)
    setSearchQuery("")
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-md border-b border-border/50">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid h-16 grid-cols-[88px_1fr_88px] items-center gap-2 sm:flex sm:justify-between sm:gap-0">
            <div className="flex items-center gap-2 justify-start">
              {pathname !== "/" && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="hidden sm:block p-2 hover:bg-secondary rounded-sm transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
              )}

              <button
                onClick={() => {
                  setMenuOpen(!menuOpen)
                  setProfileOpen(false)
                  setSearchOpen(false)
                }}
                className="p-2 hover:bg-secondary rounded-sm transition-colors"
                aria-label="Open menu"
              >
                {menuOpen ? <X className="w-7 h-7 sm:w-6 sm:h-6" /> : <Menu className="w-7 h-7 sm:w-6 sm:h-6" />}
              </button>
            </div>

            <Link
              href="/"
              onClick={closeAll}
              className="flex min-w-0 items-center justify-center overflow-visible sm:absolute sm:left-1/2 sm:-translate-x-1/2"
            >
              <Image
                src="/images/paddler-logo-removedbg.png"
                alt="THE PADDLER"
                width={320}
                height={104}
                className="object-contain h-16 w-auto max-w-[190px] -my-1 sm:h-20 sm:max-w-none sm:-my-2"
                priority
              />
            </Link>

            <div className="flex items-center justify-end gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setSearchOpen(true)
                  setMenuOpen(false)
                  setProfileOpen(false)
                }}
                className="relative hidden p-2 hover:bg-secondary rounded-sm transition-colors sm:block"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {user && (
                <Link
                  href="/wishlist"
                  onClick={closeAll}
                  className="relative hidden p-2 hover:bg-secondary rounded-sm transition-colors sm:block"
                  aria-label="Wishlist"
                >
                  <Heart className="w-5 h-5" />

                  {totalWishlistItems > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {totalWishlistItems}
                    </span>
                  )}
                </Link>
              )}

              <Link
                href="/cart"
                onClick={closeAll}
                className="relative p-2 hover:bg-secondary rounded-sm transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart className="w-6 h-6 sm:w-5 sm:h-5" />

                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-accent text-background text-xs font-bold rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>

              <div className="relative">
                <button
                  onClick={() => {
                    setProfileOpen(!profileOpen)
                    setMenuOpen(false)
                    setSearchOpen(false)
                  }}
                  className="p-2 hover:bg-secondary rounded-sm transition-colors"
                  aria-label="Profile"
                >
                  <User className="w-6 h-6 sm:w-5 sm:h-5" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-background border border-border shadow-2xl p-5">
                    {user ? (
                      <>
                        <p className="text-sm font-bold text-foreground truncate">
                          {user.displayName || "Customer"}
                        </p>

                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {user.email}
                        </p>

                        <div className="h-px bg-border my-4" />

                        <Link href="/account" onClick={closeAll} className="block py-2 text-sm text-muted-foreground hover:text-foreground">
                          Edit Profile
                        </Link>

                        <Link href="/orders" onClick={closeAll} className="block py-2 text-sm text-muted-foreground hover:text-foreground">
                          My Orders
                        </Link>

                        <Link href="/addresses" onClick={closeAll} className="block py-2 text-sm text-muted-foreground hover:text-foreground">
                          Saved Addresses
                        </Link>

                        <Link href="/contact" onClick={closeAll} className="block py-2 text-sm text-muted-foreground hover:text-foreground">
                          Contact Us
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 mt-3 pt-4 border-t border-border w-full text-left text-sm text-red-400 hover:text-red-300"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold mb-4">Account</p>

                        <Link href="/login" onClick={closeAll} className="block w-full bg-foreground text-background text-center py-3 text-sm font-bold hover:bg-foreground/90">
                          Login
                        </Link>

                        <Link href="/signup" onClick={closeAll} className="block text-center mt-4 text-sm text-muted-foreground hover:text-foreground underline">
                          Create Account
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {menuOpen && (
            <div className="absolute left-4 top-20 w-72 bg-background border border-border shadow-2xl p-6">
              <p className="text-xs tracking-[0.35em] text-muted-foreground mb-6">
                MENU
              </p>

              <div className="flex flex-col gap-4">
                <Link href="/" onClick={closeAll} className="text-sm font-bold hover:text-muted-foreground">
                  Home
                </Link>

                <Link href="/shop" onClick={closeAll} className="text-sm font-bold hover:text-muted-foreground">
                  Shop
                </Link>

                <Link href="/instagram" onClick={closeAll} className="text-sm font-bold hover:text-muted-foreground">
                  Instagram
                </Link>

                <Link href="/about" onClick={closeAll} className="text-sm font-bold hover:text-muted-foreground">
                  About
                </Link>

                <Link href="/faq" onClick={closeAll} className="text-sm font-bold hover:text-muted-foreground">
                  FAQ
                </Link>

                <Link href="/archive" onClick={closeAll} className="text-sm font-bold hover:text-muted-foreground">
                  Archive
                </Link>

                <Link href="/influencers" onClick={closeAll} className="text-sm font-bold hover:text-muted-foreground">
                  Influencers
                </Link>

                <Link href="/contact" onClick={closeAll} className="text-sm font-bold hover:text-muted-foreground">
                  Contact Us
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {searchOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl text-white">
          <div className="max-w-5xl mx-auto px-4 pt-10">
            <div className="flex items-center justify-between mb-10">
              <p className="text-xs tracking-[0.35em] text-neutral-500">
                SEARCH THE DROP
              </p>

              <button
                onClick={closeAll}
                className="p-2 hover:bg-neutral-900"
                aria-label="Close search"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            <div className="border-b border-neutral-700 pb-5">
              <input
                autoFocus
                type="text"
                placeholder="Search tees, colors, drops..."
                className="w-full bg-transparent text-3xl sm:text-5xl font-black outline-none placeholder:text-neutral-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="mt-10">
              {!searchQuery && (
                <p className="text-neutral-500">
                  Try searching: black, oversized, skull, white, green
                </p>
              )}

              {searchQuery && filteredProducts.length === 0 && (
                <p className="text-neutral-500">
                  No products found for “{searchQuery}”.
                </p>
              )}

              {filteredProducts.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-5">
                  {filteredProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.slug}`}
                      onClick={closeAll}
                      className="flex gap-4 border border-neutral-800 p-4 hover:bg-neutral-950 transition-colors"
                    >
                      <div className="relative w-24 h-28 bg-neutral-900 flex-shrink-0 overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div>
                        <h3 className="font-black">
                          {product.name}
                        </h3>

                        <p className="text-sm text-neutral-500 mt-1">
                          {product.color} · {product.description}
                        </p>

                        <div className="mt-3">
                          {product.mrp && product.mrp > product.price && (
                            <p className="relative inline-block text-xs text-neutral-500">
                              <span className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-white z-10" />
                              MRP ₹{product.mrp}
                            </p>
                          )}

                          <p className="text-base font-black text-white">
                            ₹{product.price}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
