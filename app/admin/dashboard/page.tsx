"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { LoadingSpinner } from "@/components/loading-spinner"
import { redirect } from "next/navigation"
import { useAdminStore } from "@/stores/admin-store"
import {
  Users,
  Settings,
  Database,
  FileText,
  Brain,
  Search,
  Plus,
  Sliders,
  AlertTriangle,
  CheckCircle,
  Zap,
} from "lucide-react"
import {
  AreaChart,
  BarChart,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Area,
  Bar,
  Pie,
  Cell,
} from "recharts"

// Dummy data for demonstration purposes
const dashboardLayouts = {
  lg: [{ i: "0", x: 0, y: 0, w: 1, h: 2, static: true }],
  md: [{ i: "0", x: 0, y: 0, w: 1, h: 2, static: true }],
  sm: [{ i: "0", x: 0, y: 0, w: 1, h: 2, static: true }],
  xs: [{ i: "0", x: 0, y: 0, w: 1, h: 2, static: true }],
  xxs: [{ i: "0", x: 0, y: 0, w: 1, h: 2, static: true }],
}

const modules = [
  { title: "Content Manager", description: "Manage website content", href: "/admin/content", icon: FileText },
  { title: "User Manager", description: "Manage user accounts", href: "/admin/users", icon: Users },
  { title: "Settings", description: "Configure system settings", href: "/admin/settings", icon: Settings },
  { title: "Database", description: "Manage database", href: "/admin/database", icon: Database },
]

const LayoutEngine = ({ layouts, editable, storageKey }: any) => {
  return (
    <div>
      <p>Layout Engine Placeholder</p>
      <p>Layouts: {JSON.stringify(layouts)}</p>
      <p>Editable: {editable ? "true" : "false"}</p>
      <p>Storage Key: {storageKey}</p>
    </div>
  )
}

const SmartComponent = ({ title, description, type, usage, children }: any) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

const AIUIAssistant = ({ pageContext, userRole }: any) => {
  return (
    <div>
      <p>AI UI Assistant Placeholder</p>
      <p>Page Context: {pageContext}</p>
      <p>User Role: {userRole}</p>
    </div>
  )
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#a4de6c", "#d0ed57"]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border rounded p-2 shadow-md">
        <p className="label">{`${label} : ${payload[0].value}`}</p>
      </div>
    )
  }

  return null
}

const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap justify-center">
      {payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center m-1">
          <span className="mr-2 w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
          <span className="text-sm">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function EnhancedAdminDashboard() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditMode, setIsEditMode] = useState(false)

  const { dashboardWidgets, setDashboardWidgets, features, toggleFeature, systemStatus, refreshSystemStatus } =
    useAdminStore()

  useEffect(() => {
    // Fetch initial data
    refreshSystemStatus()
  }, [refreshSystemStatus])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user || user.role !== "admin") {
    redirect("/login")
  }

  // Quick stats for the overview
  const stats = [
    {
      title: "System Health",
      value:
        systemStatus.health === "healthy" ? "Healthy" : systemStatus.health === "degraded" ? "Degraded" : "Critical",
      icon:
        systemStatus.health === "healthy"
          ? CheckCircle
          : systemStatus.health === "degraded"
            ? AlertTriangle
            : AlertTriangle,
      description: `${systemStatus.uptime}% uptime in the last 30 days`,
      color:
        systemStatus.health === "healthy"
          ? "text-green-500"
          : systemStatus.health === "degraded"
            ? "text-yellow-500"
            : "text-red-500",
    },
    {
      title: "Active Users",
      value: systemStatus.activeUsers.toString(),
      icon: Users,
      description: `${systemStatus.userGrowth > 0 ? "+" : ""}${systemStatus.userGrowth}% from last month`,
      color: systemStatus.userGrowth > 0 ? "text-green-500" : "text-red-500",
    },
    {
      title: "AI Operations",
      value: systemStatus.aiOperations.toString(),
      icon: Brain,
      description: "In the last 24 hours",
    },
    {
      title: "System Load",
      value: `${systemStatus.systemLoad}%`,
      icon: Zap,
      description:
        systemStatus.systemLoad > 80 ? "High load" : systemStatus.systemLoad > 50 ? "Moderate load" : "Low load",
      color:
        systemStatus.systemLoad > 80
          ? "text-red-500"
          : systemStatus.systemLoad > 50
            ? "text-yellow-500"
            : "text-green-500",
    },
  ]

  const moduleData = [
    { name: "Module A", value: 300 },
    { name: "Module B", value: 450 },
    { name: "Module C", value: 200 },
    { name: "Module D", value: 500 },
    { name: "Module E", value: 150 },
  ]

  const lineData = [
    { name: "Jan", users: 200, ai: 100 },
    { name: "Feb", users: 300, ai: 150 },
    { name: "Mar", users: 400, ai: 200 },
    { name: "Apr", users: 300, ai: 250 },
    { name: "May", users: 500, ai: 300 },
    { name: "Jun", users: 400, ai: 350 },
  ]

  const pieData = [
    { name: "Category A", value: 400 },
    { name: "Category B", value: 300 },
    { name: "Category C", value: 300 },
    { name: "Category D", value: 200 },
  ]

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#a4de6c", "#d0ed57"]

  const filteredModules = modules.filter(
    (module) =>
      module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )
  const isEditing = false

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button variant={isEditMode ? "default" : "outline"} onClick={() => setIsEditMode(!isEditMode)}>
            <Sliders className="mr-2 h-4 w-4" />
            {isEditMode ? "Save Layout" : "Customize Dashboard"}
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Widget
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Search Admin Modules</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search modules..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="modules">Admin Modules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>Recent user engagement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={lineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="users" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Operations</CardTitle>
                <CardDescription>Distribution of AI usage by module</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={lineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={<CustomLegend />} />
                    <Bar dataKey="ai" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Module Usage</CardTitle>
                <CardDescription>Distribution of module usage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie dataKey="value" data={moduleData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                      {moduleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={<CustomLegend />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredModules.map((module, i) => (
              <SmartComponent
                key={i}
                id={`admin-module-${i}`}
                title={module.title}
                description={module.description}
                type="card"
                usage="admin"
              >
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <div className="rounded-full bg-primary/10 p-3 mb-3">
                    <module.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">{module.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                  <Button asChild>
                    <a href={module.href}>Manage</a>
                  </Button>
                </div>
              </SmartComponent>
            ))}
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

      <AIUIAssistant pageContext="admin-dashboard" userRole="admin" />
    </div>
  )
}

// Helper components
function StatCard({ title, value, icon: Icon, description, color }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-muted-foreground ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
