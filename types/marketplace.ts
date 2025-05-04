export interface Product {
  id: string
  title: string
  description: string
  price: number
  category: string
  image?: string
  creator: string
  rating?: number
  reviewCount?: number
  featured?: boolean
  affiliateCommission?: number
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  total: number
  status: "pending" | "processing" | "completed" | "cancelled"
  createdAt: string
  updatedAt: string
  paymentIntentId?: string
  referrerId?: string
}

export interface OrderItem {
  productId: string
  title: string
  price: number
  quantity: number
}

export interface AffiliateStats {
  totalReferrals: number
  totalCommission: number
  pendingCommission: number
  paidCommission: number
  recentReferrals: {
    id: string
    productTitle: string
    commission: number
    date: string
    status: "pending" | "paid"
  }[]
}
