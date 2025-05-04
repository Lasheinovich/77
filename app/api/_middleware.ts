import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { deploymentManager } from "@/lib/deployment/deployment-config"

export function middleware(request: NextRequest) {
  // Check if system is in maintenance mode
  if (deploymentManager.isInMaintenanceMode()) {
    const clientIp = request.ip || "unknown"

    // Allow specific IPs during maintenance
    if (deploymentManager.isIpAllowedDuringMaintenance(clientIp)) {
      return NextResponse.next()
    }

    // Return maintenance mode response for API requests
    return NextResponse.json(
      {
        error: "maintenance",
        message: deploymentManager.getMaintenanceMessage(),
      },
      { status: 503 },
    )
  }

  return NextResponse.next()
}
