import { performHealthCheck } from "@/lib/health-check"
import { withLogging } from "@/lib/logger"
import { NextResponse } from "next/server"

/**
 * Health check endpoint for Docker, Kubernetes and monitoring tools
 * Returns system status and basic version information
 */
export const GET = withLogging(async (request: Request) => {
  try {
    // Check for admin-only detailed health check
    const url = new URL(request.url)
    const detailed = url.searchParams.get("detailed") === "true"

    // Perform health check
    const healthCheck = await performHealthCheck()

    // For non-detailed checks, only return basic info
    if (!detailed) {
      return NextResponse.json({
        status: healthCheck.status,
        version: healthCheck.version,
        timestamp: healthCheck.timestamp,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      })
    }

    // For detailed checks, verify authorization
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const adminApiKey = process.env.ADMIN_API_KEY

    if (!adminApiKey || token !== adminApiKey) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 403 })
    }

    // Return full health check for authorized requests
    return NextResponse.json(healthCheck)
  } catch (error) {
    console.error("Health check failed:", error)

    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
})

steps:
- name: Validate Docker Credential Configuration
run: |
      if [-f ~/.docker/config.json]; then
if grep - q "\"credsStore\":\s*\"none\"" ~/.docker/config.json; then
          echo "::warning::Invalid Docker credential store configuration detected"
          exit 1
fi
fi
