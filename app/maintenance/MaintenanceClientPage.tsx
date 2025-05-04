"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { deploymentManager } from "@/lib/deployment/deployment-config"
import { Settings, AlertTriangle, Clock, RefreshCw } from "lucide-react"

export default function MaintenanceClientPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 bg-yellow-100 p-3 rounded-full">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">System Maintenance</CardTitle>
          <CardDescription>{deploymentManager.getMaintenanceMessage()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 text-sm">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span>Our team is working to improve the system</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>We'll be back shortly</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
