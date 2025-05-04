import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export type HealthStatus = "healthy" | "degraded" | "unhealthy"

export interface HealthCheckResult {
  status: HealthStatus
  timestamp: string
  version: string
  buildId: string
  uptime: number
  environment: string
  region?: string
  checks: Record<
    string,
    {
      status: HealthStatus
      message?: string
      latency?: number
    }
  >
}

/**
 * Performs a comprehensive health check of the system
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now()
  const checks: HealthCheckResult["checks"] = {}
  let overallStatus: HealthStatus = "healthy"

  // Calculate server uptime
  const uptimeSeconds = Math.floor(process.uptime())

  // Get deployment environment and region
  const environment = process.env.NODE_ENV || "development"
  const region = process.env.VERCEL_REGION || undefined

  // Check database connection
  try {
    const dbStartTime = Date.now()
    const { data, error } = await db.from("health_checks").select("id").limit(1)
    const dbLatency = Date.now() - dbStartTime

    if (error) {
      checks.database = {
        status: "unhealthy",
        message: error.message,
        latency: dbLatency,
      }
      overallStatus = "unhealthy"
    } else {
      checks.database = {
        status: "healthy",
        latency: dbLatency,
      }
    }
  } catch (error) {
    checks.database = {
      status: "unhealthy",
      message: error instanceof Error ? error.message : String(error),
    }
    overallStatus = "unhealthy"
  }

  // Check memory usage
  try {
    if (typeof process !== 'undefined') {
      const memoryUsage = process.memoryUsage()
      const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
      const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024)
      const memoryPercentage = Math.round((memoryUsedMB / memoryTotalMB) * 100)

      // Set thresholds for degraded and unhealthy states
      const memoryStatus: HealthStatus =
        memoryPercentage > 95 ? "unhealthy" :
          memoryPercentage > 85 ? "degraded" : "healthy"

      checks.memory = {
        status: memoryStatus,
        message: `${memoryUsedMB}MB / ${memoryTotalMB}MB (${memoryPercentage}%)`,
      }

      if (memoryStatus === "degraded") {
        overallStatus = overallStatus === "healthy" ? "degraded" : overallStatus
      } else if (memoryStatus === "unhealthy") {
        overallStatus = "unhealthy"
      }
    }
  } catch (error) {
    checks.memory = {
      status: "degraded",
      message: error instanceof Error ? error.message : String(error),
    }
    overallStatus = overallStatus === "healthy" ? "degraded" : overallStatus
  }

  // Check disk space (Node.js server-side only)
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    try {
      const { execSync } = require('child_process')
      const diskInfo = execSync('df -h / | tail -1').toString().trim().split(/\s+/)

      if (diskInfo.length >= 5) {
        const usedPercentage = parseInt(diskInfo[4].replace('%', ''))

        const diskStatus: HealthStatus =
          usedPercentage > 90 ? "unhealthy" :
            usedPercentage > 80 ? "degraded" : "healthy"

        checks.disk = {
          status: diskStatus,
          message: `${diskInfo[4]} used (${diskInfo[2]} / ${diskInfo[1]})`,
        }

        if (diskStatus === "degraded") {
          overallStatus = overallStatus === "healthy" ? "degraded" : overallStatus
        } else if (diskStatus === "unhealthy") {
          overallStatus = "unhealthy"
        }
      }
    } catch (error) {
      logger.warn("Could not check disk space", { error })
      // Don't fail the health check entirely for disk space check
    }
  }

  // Check API endpoints - avoid infinite recursion by checking a different endpoint
  try {
    const apiStartTime = Date.now()
    const response = await fetch('/api/monitoring/status', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store',
      },
    })
    const apiLatency = Date.now() - apiStartTime

    if (!response.ok) {
      checks.api = {
        status: "unhealthy",
        message: `API returned ${response.status}`,
        latency: apiLatency,
      }
      overallStatus = "unhealthy"
    } else {
      checks.api = {
        status: "healthy",
        latency: apiLatency,
      }
    }
  } catch (error) {
    // If the API endpoint doesn't exist, don't fail the health check
    checks.api = {
      status: "degraded",
      message: error instanceof Error ? error.message : String(error),
    }
    overallStatus = overallStatus === "healthy" ? "degraded" : overallStatus
  }

  // Check external dependencies - Supabase
  try {
    const supabaseStartTime = Date.now()
    const { data, error } = await db.from('_health').select('*').limit(1)
    const supabaseLatency = Date.now() - supabaseStartTime

    if (error) {
      checks.supabase = {
        status: "unhealthy",
        message: error.message,
        latency: supabaseLatency,
      }
      overallStatus = "unhealthy"
    } else {
      checks.supabase = {
        status: "healthy",
        latency: supabaseLatency,
      }
    }
  } catch (error) {
    checks.supabase = {
      status: "unhealthy",
      message: error instanceof Error ? error.message : String(error),
    }
    overallStatus = "unhealthy"
  }

  // Add check for server load
  if (typeof process !== 'undefined') {
    try {
      const os = require('os')
      const load = os.loadavg()
      const cpuCount = os.cpus().length

      // Normalize load against CPU count
      const normalizedLoad = load[0] / cpuCount

      const loadStatus: HealthStatus =
        normalizedLoad > 1.5 ? "unhealthy" :
          normalizedLoad > 0.8 ? "degraded" : "healthy"

      checks.serverLoad = {
        status: loadStatus,
        message: `Load: ${load[0].toFixed(2)}, ${load[1].toFixed(2)}, ${load[2].toFixed(2)} (Normalized: ${normalizedLoad.toFixed(2)})`,
      }

      if (loadStatus === "degraded") {
        overallStatus = overallStatus === "healthy" ? "degraded" : overallStatus
      } else if (loadStatus === "unhealthy") {
        overallStatus = "unhealthy"
      }
    } catch (error) {
      // Don't fail the health check for load average
      logger.warn("Could not check server load", { error })
    }
  }

  // Record health check result
  const result: HealthCheckResult = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_VERSION || "unknown",
    buildId: process.env.NEXT_PUBLIC_BUILD_ID || "development",
    uptime: uptimeSeconds,
    environment,
    region,
    checks,
  }

  // Log health check result
  logger.info(`Health check completed: ${overallStatus}`, {
    healthCheck: result,
    duration: Date.now() - startTime,
  })

  // Store health check result in database for monitoring
  try {
    await db.from("health_checks").insert({
      status: overallStatus,
      checks: result.checks,
      timestamp: result.timestamp,
      uptime: uptimeSeconds,
      environment,
      region,
    })
  } catch (error) {
    logger.error("Failed to store health check result", { error })
  }

  return result
}

/**
 * Schedules regular health checks based on Docker healthcheck configuration
 */
export function scheduleHealthChecks(intervalSeconds = 30): () => void {
  // Only run in server environment
  if (typeof window !== "undefined") {
    return () => { }
  }

  const interval = setInterval(
    async () => {
      try {
        await performHealthCheck()
      } catch (error) {
        logger.error("Scheduled health check failed", { error })
      }
    },
    intervalSeconds * 1000,
  )

  // Return cleanup function
  return () => clearInterval(interval)
}

/**
 * Initialize the health check system
 */
export function initializeHealthCheckSystem(): void {
  if (typeof window !== 'undefined' || process.env.NODE_ENV === 'development') {
    return
  }

  // Register the health check cleanup on process termination
  const cleanup = scheduleHealthChecks(30)

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, stopping health checks')
    cleanup()
  })

  process.on('SIGINT', () => {
    logger.info('SIGINT received, stopping health checks')
    cleanup()
  })

  logger.info('Health check system initialized')
}
