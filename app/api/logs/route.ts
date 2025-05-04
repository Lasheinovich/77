import { NextResponse } from "next/server"
import { withRateLimit } from "@/lib/rate-limit"
import { withLogging } from "@/lib/logger"
import { logger } from "@/lib/logger"
import { redis } from "@/lib/redis"
import { logsRequestSchema, validateRequest } from "@/lib/validations/api-schemas"

const handler = withLogging(async (request: Request) => {
  try {
    const body = await request.json()
    
    // Validate request payload
    const validation = await validateRequest(logsRequestSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { logs } = validation.data

    // Process logs in batches to avoid exceeding database limits
    const batchSize = 50
    for (let i = 0; i < logs.length; i += batchSize) {
      const batch = logs.slice(i, i + batchSize)

      // In production, store logs in Redis for processing by background job
      if (process.env.NODE_ENV === "production") {
        const key = `logs:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`
        await redis.set(key, JSON.stringify(batch), 24 * 60 * 60 * 1000) // 24 hours TTL
      } else {
        // In development, just log to console
        batch.forEach((log) => {
          const level = log.level || "info"
          logger[level](log.message, {
            ...log.context,
            timestamp: log.timestamp,
            userId: log.userId,
            sessionId: log.sessionId,
            requestId: log.requestId,
            url: log.url,
            method: log.method,
            statusCode: log.statusCode,
            duration: log.duration,
          })
        })
      }
    }

    return NextResponse.json({
      success: true,
      meta: { processedLogs: logs.length }
    })
  } catch (error) {
    logger.error("Error processing logs", error as Error)
    return NextResponse.json(
      { 
        success: false,
        error: {
          message: "Failed to process logs",
          code: "LOGS_PROCESSING_ERROR",
          details: process.env.NODE_ENV === "development" ? 
            { error: error instanceof Error ? error.message : String(error) } : 
            undefined
        }
      },
      { status: 500 }
    )
  }
})

// Apply rate limiting to prevent abuse
export const POST = withRateLimit(handler, {
  limit: 50, // 50 requests per minute
  windowMs: 60 * 1000,
  keyGenerator: (req) => req.headers.get("x-forwarded-for") || "anonymous",
})
