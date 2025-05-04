"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/hooks/use-cart"
import type { Product } from "@/types/marketplace"
import { Heart, Share2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface ProductCardProps {
  product: Product
  showAffiliate?: boolean
}

export function ProductCard({ product, showAffiliate = false }: ProductCardProps) {
  const { toast } = useToast()
  const { addItem } = useCart()
  const [isLiked, setIsLiked] = useState(false)

  const handleAddToCart = () => {
    addItem(product)
    toast({
      title: "Added to cart",
      description: `${product.title} has been added to your cart`,
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description,
          url: `${window.location.origin}/marketplace/product/${product.id}?ref=${localStorage.getItem("userId") || ""}`,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(
        `${window.location.origin}/marketplace/product/${product.id}?ref=${localStorage.getItem("userId") || ""}`,
      )
      toast({
        title: "Link copied",
        description: "Affiliate link copied to clipboard",
      })
    }
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="aspect-video w-full relative">
        <Image src={product.image || "/placeholder.svg"} alt={product.title} fill className="object-cover" />
        <div className="absolute top-2 right-2 flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
            onClick={() => setIsLiked(!isLiked)}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            <span className="sr-only">Like</span>
          </Button>
          {showAffiliate && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              <span className="sr-only">Share</span>
            </Button>
          )}
        </div>
      </div>
      <CardHeader className="flex-none">
        <div className="flex justify-between items-start">
          <Link href={`/marketplace/product/${product.id}`}>
            <CardTitle className="hover:text-primary transition-colors">{product.title}</CardTitle>
          </Link>
          <Badge>{product.category}</Badge>
        </div>
        <CardDescription>{product.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-sm text-muted-foreground">By {product.creator}</div>
          </div>
          {product.rating && (
            <div className="flex items-center">
              <span className="text-yellow-500 mr-1">★</span>
              <span className="text-sm font-medium">{product.rating}</span>
              <span className="text-xs text-muted-foreground ml-1">({product.reviewCount || 0})</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex-none">
        <div className="flex items-center justify-between w-full">
          <div className="text-xl font-bold">${product.price.toFixed(2)}</div>
          <Button onClick={handleAddToCart}>Add to Cart</Button>
        </div>
      </CardFooter>
    </Card>
  )
}
