"use client"

import { useState } from "react"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/hooks/use-translation"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, ShoppingCart, Filter } from "lucide-react"
import Image from "next/image"

export default function MarketplacePage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [cartItems, setCartItems] = useState<number>(0)

  // Mock products data
  const products = [
    {
      id: 1,
      title: "Advanced AI Course",
      description: "Learn the fundamentals of artificial intelligence and machine learning",
      price: 49.99,
      category: "course",
      image: "/abstract-ai-learning.png",
    },
    {
      id: 2,
      title: "Business Analytics Dashboard",
      description: "Ready-to-use business analytics dashboard template",
      price: 29.99,
      category: "template",
      image: "/clean-data-dashboard.png",
    },
    {
      id: 3,
      title: "AI Writing Assistant",
      description: "Premium AI writing assistant subscription",
      price: 19.99,
      category: "subscription",
      image: "/digital-writing-assistant.png",
    },
    {
      id: 4,
      title: "Data Science Toolkit",
      description: "Comprehensive data science tools and resources",
      price: 39.99,
      category: "toolkit",
      image: "/data-science-workbench.png",
    },
    {
      id: 5,
      title: "Web Development Masterclass",
      description: "Complete web development course from beginner to advanced",
      price: 59.99,
      category: "course",
      image: "/interconnected-code.png",
    },
    {
      id: 6,
      title: "AI Research Paper Collection",
      description: "Collection of cutting-edge AI research papers with annotations",
      price: 24.99,
      category: "ebook",
      image: "/placeholder.svg?height=200&width=300&query=Research%20Papers",
    },
  ]

  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const addToCart = () => {
    setCartItems(cartItems + 1)
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {cartItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">{cartItems}</Badge>
          )}
        </Button>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="ebooks">E-Books</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-video w-full relative">
                  <Image src={product.image || "/placeholder.svg"} alt={product.title} fill className="object-cover" />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{product.title}</CardTitle>
                    <Badge>{product.category}</Badge>
                  </div>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-between">
                  <div className="text-xl font-bold">${product.price}</div>
                  <Button onClick={addToCart}>Add to Cart</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="courses" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts
              .filter((product) => product.category === "course")
              .map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-video w-full relative">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{product.title}</CardTitle>
                      <Badge>{product.category}</Badge>
                    </div>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between">
                    <div className="text-xl font-bold">${product.price}</div>
                    <Button onClick={addToCart}>Add to Cart</Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
        <TabsContent value="templates" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts
              .filter((product) => product.category === "template")
              .map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-video w-full relative">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{product.title}</CardTitle>
                      <Badge>{product.category}</Badge>
                    </div>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between">
                    <div className="text-xl font-bold">${product.price}</div>
                    <Button onClick={addToCart}>Add to Cart</Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
