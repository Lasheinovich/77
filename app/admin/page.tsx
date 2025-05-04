"use client"

import { useAuth } from "@/components/auth-provider"
import { useTranslation } from "@/hooks/use-translation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/loading-spinner"
import { redirect } from "next/navigation"
import {
  Users,
  DollarSign,
  Activity,
  Settings,
  Shield,
  Database,
  FileText,
  MessageSquare,
  Code,
  BookOpen,
  Brain,
} from "lucide-react"
import { useEffect } from "react"

export default function AdminDashboardPage() {
  const { user, loading } = useAuth()
  const { t } = useTranslation()

  useEffect(() => {
    // Check for ADMIN_API_KEY in local storage or cookies
    const adminApiKey =
      localStorage.getItem("adminApiKey") ||
      document.cookie.replace(/(?:(?:^|.*;\s*)adminApiKey\s*=\s*([^;]*).*$)|^.*$/, "$1")

    if (!adminApiKey || adminApiKey !== process.env.ADMIN_API_KEY) {
      // Redirect to login or display an error message
      redirect("/login") // Or handle the unauthorized access as needed
    }
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user || user.role !== "admin") {
    redirect("/login")
  }

  const stats = [
    {
      title: "Total Users",
      value: "1,234",
      icon: Users,
      description: "12% increase from last month",
    },
    {
      title: "Revenue",
      value: "$12,345",
      icon: DollarSign,
      description: "8% increase from last month",
    },
    {
      title: "Active Courses",
      value: "24",
      icon: BookOpen,
      description: "3 new courses this month",
    },
    {
      title: "System Health",
      value: "99.9%",
      icon: Activity,
      description: "Uptime in the last 30 days",
    },
  ]

  const adminModules = [
    {
      title: "User Management",
      icon: Users,
      href: "/admin/users",
      description: "Manage users and permissions",
    },
    {
      title: "Content Management",
      icon: FileText,
      href: "/admin/content",
      description: "Manage courses and learning materials",
    },
    {
      title: "System Settings",
      icon: Settings,
      href: "/admin/settings",
      description: "Configure system settings",
    },
    {
      title: "Security",
      icon: Shield,
      href: "/admin/security",
      description: "Security settings and logs",
    },
    {
      title: "Database",
      icon: Database,
      href: "/admin/database",
      description: "Database management and backups",
    },
    {
      title: "AI Models",
      icon: Brain,
      href: "/admin/ai-models",
      description: "Manage AI models and configurations",
    },
    {
      title: "Chat Logs",
      icon: MessageSquare,
      href: "/admin/chat-logs",
      description: "View AI chat logs and analytics",
    },
    {
      title: "Code Playground",
      icon: Code,
      href: "/admin/code-playground",
      description: "Manage code playground settings",
    },
  ]

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
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
            <h3 className="text-lg font-medium mb-4">Admin Modules</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {adminModules.map((module, i) => (
                <Card key={i} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{module.title}</CardTitle>
                    <module.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{module.description}</p>
                    <Button variant="link" className="p-0 h-auto mt-2" asChild>
                      <a href={module.href}>Manage</a>
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
              <CardDescription>View detailed analytics of platform usage</CardDescription>
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
              <CardDescription>View and generate system reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded">
                <p className="text-muted-foreground">Reports will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure global system settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded">
                <p className="text-muted-foreground">Settings panel will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
