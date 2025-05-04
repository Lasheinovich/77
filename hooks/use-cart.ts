"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Product } from "@/types/marketplace"

interface CartItem extends Product {
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const currentItems = get().items
        const existingItem = currentItems.find((item) => item.id === product.id)

        if (existingItem) {
          // Update quantity if item already exists
          set({
            items: currentItems.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
            ),
          })
        } else {
          // Add new item
          set({ items: [...currentItems, { ...product, quantity: 1 }] })
        }
      },
      removeItem: (productId) => {
        set({
          items: get().items.filter((item) => item.id !== productId),
        })
      },
      updateQuantity: (productId, quantity) => {
        set({
          items: get().items.map((item) => (item.id === productId ? { ...item, quantity } : item)),
        })
      },
      clearCart: () => {
        set({ items: [] })
      },
      totalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
      totalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
      },
    }),
    {
      name: "cart-storage",
    },
  ),
)
