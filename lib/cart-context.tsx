"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

export interface CartItem {
  id: number
  name: string
  description: string
  price: number
  image: string
  quantity: number
  size: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void
  removeItem: (id: number, size: string) => void
  updateQuantity: (id: number, size: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const savedCart = localStorage.getItem("the-paddler-cart")
    if (savedCart) {
      setItems(JSON.parse(savedCart))
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("the-paddler-cart", JSON.stringify(items))
    }
  }, [items, isLoaded])

  const addItem = (newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    const quantityToAdd = newItem.quantity || 1

    setItems((prev) => {
      const existingItem = prev.find(
        (item) => item.id === newItem.id && item.size === newItem.size
      )

      if (existingItem) {
        return prev.map((item) =>
          item.id === newItem.id && item.size === newItem.size
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        )
      }

      return [...prev, { ...newItem, quantity: quantityToAdd }]
    })
  }

  const removeItem = (id: number, size: string) => {
    setItems((prev) => prev.filter((item) => !(item.id === id && item.size === size)))
  }

  const updateQuantity = (id: number, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id, size)
      return
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === id && item.size === size ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
    localStorage.removeItem("the-paddler-cart")
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)

  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }

  return context
}