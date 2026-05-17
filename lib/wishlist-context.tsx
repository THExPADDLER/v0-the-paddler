"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export interface WishlistItem {
  id: number
  name: string
  description: string
  price: number
  mrp?: number
  image: string
  slug?: string
}

interface WishlistContextType {
  items: WishlistItem[]
  addToWishlist: (item: WishlistItem) => void
  removeFromWishlist: (id: number) => void
  isInWishlist: (id: number) => boolean
  totalWishlistItems: number
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const savedWishlist = localStorage.getItem("the-paddler-wishlist")

    if (savedWishlist) {
      setItems(JSON.parse(savedWishlist))
    }

    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("the-paddler-wishlist", JSON.stringify(items))
    }
  }, [items, isLoaded])

  const addToWishlist = (item: WishlistItem) => {
    setItems((prev) => {
      const exists = prev.find((wishlistItem) => wishlistItem.id === item.id)

      if (exists) {
        return prev
      }

      return [...prev, item]
    })
  }

  const removeFromWishlist = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const isInWishlist = (id: number) => {
    return items.some((item) => item.id === id)
  }

  const totalWishlistItems = items.length

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        totalWishlistItems,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)

  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }

  return context
}
