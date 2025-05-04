"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/use-translation"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api-client" // Import the API client

export default function PricingPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly")

  const plans = [
    {
      id: "basic",
      name: "Basic",
      description: "Essential features for individuals",
      price: billingInterval === "monthly" ? 9.99 : 99.99,
      priceIds: {
        monthly: "price_basic_monthly",
        yearly: "price_basic_yearly",
      },
      features: ["AI Assistant", "Basic Learning Paths", "Document Generation", "Community Access"],
    },
    {
      id: "pro",
      name: "Professional",
      description: "Advanced features for professionals",
      price: billingInterval === "monthly" ? 19.99 : 199.99,
      priceIds: {
        monthly: "price_pro_monthly",
        yearly: "price_pro_yearly",
      },
      features: [
        "Everything in Basic",
        "Advanced AI Agents",
        "Coding Playground",
        "Document & Report Generation",
        "Marketplace Access",
        "Priority Support",
      ],
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Complete solution for businesses",
      price: billingInterval === "monthly" ? 49.99 : 499.99,
      priceIds: {
        monthly: "price_enterprise_monthly",
        yearly: "price_enterprise_yearly",
      },
      features: [
        "Everything in Professional",
        "Custom AI Agents",
        "Team Collaboration",
        "Advanced Analytics",
        "API Access",
        "Dedicated Support",
        "Custom Integrations",
      ],
    },
  ]

  const handleSubscription = async (priceId: string, planId: string) => {
    if (!user) {
      router.push("/login?redirect=/pricing")
      return
    }

    setIsLoading(planId)
    try {
      // Use the API client instead of direct fetch
      const data = await api.post<{ url: string }>("/api/create-checkout-session", {
        priceId,
        userId: user.id,
        email: user.email,
      });
      
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("Failed to create checkout session")
      }
    } catch (error) {
      console.error("Error creating checkout session:", error)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Pricing Plans</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Choose the perfect plan for your needs. All plans include core features.
        </p>
      </div>

      <div className="mt-8 flex justify-center">
        <Tabs
          defaultValue="monthly"
          value={billingInterval}
          onValueChange={(value) => setBillingInterval(value as "monthly" | "yearly")}
          className="w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">
              Yearly <Badge className="ml-2 bg-primary/20 text-primary">Save 15%</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={`flex flex-col ${plan.popular ? "border-primary shadow-lg" : ""}`}>
            {plan.popular && (
              <div className="absolute -top-4 left-0 right-0 mx-auto w-32">
                <Badge className="w-full justify-center">Most Popular</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/{billingInterval}</span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleSubscription(plan.priceIds[billingInterval], plan.id)}
                disabled={isLoading === plan.id}
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
              >
                {isLoading === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Subscribe to ${plan.name}`
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-10 text-center">
        <h2 className="text-xl font-semibold">Enterprise Solutions</h2>
        <p className="mt-2 text-muted-foreground">Need a custom solution for your organization?</p>
        <Button variant="link" className="mt-2">
          Contact Sales
        </Button>
      </div>
    </div>
  )
}
