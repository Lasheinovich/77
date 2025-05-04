"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { LoadingSpinner } from "@/components/loading-spinner"
import { redirect } from "next/navigation"
import type { HealthCheckResult } from "@/lib/health-check"
import { getRecentErrors } from "@/lib/error-tracking"
import { serviceManager } from "@/lib/service-manager"
import { api } from "@/lib/api-client" // Import the API client
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  HardDrive,
  Lock,
  RefreshCw,
  Server,
  XCircle,
} from "lucide-react"

export default function SystemHealthPage() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [healthData, setHealthData] = useState<HealthCheckResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [servicesStatus, setServicesStatus] = useState<any>(null)
  const [recentErrors, setRecentErrors] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchHealthData()
    fetchServicesStatus()
    fetchRecentErrors()

    // Set up polling for health data
    const interval = setInterval(fetchHealthData, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchHealthData = async () => {
    try {
      // Use the API client instead of direct fetch
      const data = await api.get<HealthCheckResult>("/api/health")
      setHealthData(data)
    } catch (error) {
      console.error("Error fetching health data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch system health data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchServicesStatus = async () => {
    // In a real implementation, this would be an API call
    // For now, we'll use the service manager directly
    setServicesStatus(serviceManager.getServicesStatus())
  }

  const fetchRecentErrors = async () => {
    // In a real implementation, this would be an API call
    // For now, we'll use the error tracking directly
    setRecentErrors(getRecentErrors(10))
  }

  const refreshAll = async () => {
    setRefreshing(true)
    try {
      await Promise.all([fetchHealthData(), fetchServicesStatus(), fetchRecentErrors()])
      toast({
        title: "Refreshed",
        description: "System health data has been refreshed",
      })
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast({
        title: "Error",
        description: "Failed to refresh system health data",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const triggerHealthCheck = async (serviceName: string) => {
    try {
      await serviceManager.triggerHealthCheck(serviceName)
      fetchServicesStatus()
      toast({
        title: "Health Check Triggered",
        description: `Health check for ${serviceName} has been triggered`,
      })
    } catch (error) {
      console.error(`Error triggering health check for ${serviceName}:`, error)
      toast({
        title: "Error",
        description: `Failed to trigger health check for ${serviceName}`,
        variant: "destructive",
      })
    }
  }

  const triggerRestart = async (serviceName: string) => {
    try {
      await serviceManager.triggerRestart(serviceName)
      fetchServicesStatus()
      toast({
        title: "Restart Triggered",
        description: `Restart for ${serviceName} has been triggered`,
      })
    } catch (error) {
      console.error(`Error triggering restart for ${serviceName}:`, error)
      toast({
        title: "Error",
        description: `Failed to trigger restart for ${serviceName}`,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user || user.role !== "admin") {
    redirect("/login")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500"
      case "degraded":
        return "bg-yellow-500"
      case "unhealthy":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-500">Healthy</Badge>
      case "degraded":
        return <Badge className="bg-yellow-500">Degraded</Badge>
      case "unhealthy":
        return <Badge className="bg-red-500">Unhealthy</Badge>
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>
    }
  }

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName) {
      case "database":
        return <Database className="h-5 w-5" />
      case "ai":
        return <Activity className="h-5 w-5" />
      case "auth":
        return <Lock className="h-5 w-5" />
      case "storage":
        return <HardDrive className="h-5 w-5" />
      default:
        return <Server className="h-5 w-5" />
    }
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">System Health</h1>
        <Button onClick={refreshAll} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-6">
          {/* Overall System Health */}
          <Card>
            <CardHeader
              className={`bg-${healthData?.status === "healthy" ? "green" : healthData?.status === "degraded" ? "yellow" : "red"}-500/10`}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {healthData?.status === "healthy" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : healthData?.status === "degraded" ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  System Status: {healthData?.status.charAt(0).toUpperCase() + healthData?.status.slice(1)}
                </CardTitle>
                {getStatusBadge(healthData?.status || "unknown")}
              </div>
              <CardDescription>
                {healthData?.overall.message} • Last updated:{" "}
                {healthData?.overall.timestamp ? new Date(healthData.overall.timestamp).toLocaleString() : "N/A"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {healthData &&
                  Object.entries(healthData.services).map(([name, service]) => (
                    <Card key={name} className="overflow-hidden">
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            {getServiceIcon(name)}
                            {name.charAt(0).toUpperCase() + name.slice(1)}
                          </CardTitle>
                          {getStatusBadge(service.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Latency:</span>
                            <span>{service.latency ? `${service.latency}ms` : "N/A"}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Last Checked:</span>
                            <span>
                              {service.lastChecked ? new Date(service.lastChecked).toLocaleTimeString() : "N/A"}
                            </span>
                          </div>
                          {service.message && <div className="text-sm text-red-500 mt-2">{service.message}</div>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="services">
            <TabsList>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="errors">Recent Errors</TabsTrigger>
              <TabsTrigger value="logs">System Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Service Management</CardTitle>
                  <CardDescription>Monitor and manage system services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {servicesStatus &&
                      Object.entries(servicesStatus).map(([name, service]: [string, any]) => (
                        <div key={name} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getServiceIcon(name)}
                              <h3 className="font-medium">{name.charAt(0).toUpperCase() + name.slice(1)}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-2 w-2 rounded-full ${getStatusColor(service.status.healthCheckStatus)}`}
                              />
                              <span className="text-sm">{service.status.isRunning ? "Running" : "Stopped"}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Health Status:</span>
                              <span className="ml-2">{service.status.healthCheckStatus}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Failed Checks:</span>
                              <span className="ml-2">{service.status.failedHealthChecks}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Restart Attempts:</span>
                              <span className="ml-2">{service.status.restartAttempts}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Last Health Check:</span>
                              <span className="ml-2">
                                {service.status.lastHealthCheck
                                  ? new Date(service.status.lastHealthCheck).toLocaleString()
                                  : "Never"}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => triggerHealthCheck(name)}>
                              <Activity className="h-4 w-4 mr-2" />
                              Health Check
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => triggerRestart(name)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Restart
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="errors" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Errors</CardTitle>
                  <CardDescription>View and analyze recent system errors</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentErrors.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>No errors recorded recently. The system is running smoothly.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentErrors.map((error, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            <h3 className="font-medium">{error.error.message}</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Timestamp:</span>
                              <span className="ml-2">{new Date(error.timestamp).toLocaleString()}</span>
                            </div>
                            {error.metadata?.component && (
                              <div>
                                <span className="text-muted-foreground">Component:</span>
                                <span className="ml-2">{error.metadata.component}</span>
                              </div>
                            )}
                            {error.metadata?.severity && (
                              <div>
                                <span className="text-muted-foreground">Severity:</span>
                                <span className="ml-2">{error.metadata.severity}</span>
                              </div>
                            )}
                          </div>
                          <details className="text-sm">
                            <summary className="cursor-pointer font-medium">Stack Trace</summary>
                            <pre className="mt-2 p-2 bg-muted rounded-md overflow-auto text-xs">
                              {error.error.stack}
                            </pre>
                          </details>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Logs</CardTitle>
                  <CardDescription>View detailed system logs and events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    <p>System logs will be displayed here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
