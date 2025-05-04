import { NextResponse } from "next/server"
import { performHealthCheck } from "@/lib/health-check"
import { withLogging } from "@/lib/logger"

// Simple health check endpoint for Docker
export const GET = withLogging(async () => {
  try {
    const healthCheck = await performHealthCheck()
    
    // Return 200 only if healthy, otherwise 503
    if (healthCheck.status === "healthy") {
      return NextResponse.json({
        status: "healthy",
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json({
      status: healthCheck.status,
      timestamp: new Date().toISOString()
    }, { status: 503 })
    
  } catch (error) {
    return NextResponse.json({
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
})