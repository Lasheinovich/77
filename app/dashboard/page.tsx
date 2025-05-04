"use client"

import { useAuth } from "@/components/auth-provider"
import { useTranslation } from "@/hooks/use-translation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/loading-spinner"
import { redirect } from "next/navigation"
import { BarChart, BookOpen, Brain, Code, FileText, MessageSquare, ShoppingCart, Users } from "lucide-react"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const { t } = useTranslation()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    redirect("/login")
  }

  const stats = [
    {
      title: "Total Users",
      value: "1,234",
      icon: Users,
      description: "Active users in the platform",
    },
    {
      title: "AI Conversations",
      value: "5,678",
      icon: MessageSquare,
      description: "Total AI interactions",
    },
    {
      title: "Learning Paths",
      value: "24",
      icon: BookOpen,
      description: "Available learning paths",
    },
    {
      title: "Marketplace Items",
      value: "432",
      icon: ShoppingCart,
      description: "Products in the marketplace",
    },
  ]

  const quickActions = [
    {
      title: "AI Assistant",
      icon: Brain,
      href: "/ai-assistant",
      description: "Chat with the AI assistant",
    },
    {
      title: "Coding Playground",
      icon: Code,
      href: "/coding-playground",
      description: "Generate and test code",
    },
    {
      title: "Document Generator",
      icon: FileText,
      href: "/document-generator",
      description: "Create AI-powered documents",
    },
    {
      title: "Analytics",
      icon: BarChart,
      href: "/analytics",
      description: "View platform analytics",
    },
  ]

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action, i) => (
                <Card key={i} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{action.title}</CardTitle>
                    <action.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                    <Button variant="link" className="p-0 h-auto mt-2" asChild>
                      <a href={action.href}>Open</a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>View detailed analytics of your activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded">
                <p className="text-muted-foreground">Analytics visualization will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>View and generate reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded">
                <p className="text-muted-foreground">Reports will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage your notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded">
                <p className="text-muted-foreground">No new notifications</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
