import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { withLogging } from "@/lib/logger"
import { withRateLimit } from "@/lib/rate-limit"

export const POST = withLogging(
  withRateLimit(
    async (request: Request) => {
      try {
        const errorData = await request.json()

        // Validate the error data
        if (!errorData.message) {
          return NextResponse.json({ error: "Invalid error data" }, { status: 400 })
        }

        // Store error in database for persistence
        await db.from("error_logs").insert({
          id: errorData.id,
          message: errorData.message,
          stack: errorData.stack,
          component_stack: errorData.componentStack,
          metadata: errorData.metadata,
          timestamp: errorData.timestamp,
          user_id: errorData.metadata?.userId,
          url: errorData.metadata?.url,
          severity: errorData.metadata?.severity || "medium",
        })

        // Log to our logging system
        logger.error(`Client error logged: ${errorData.message}`, {
          errorId: errorData.id,
          ...errorData.metadata,
        })

        return NextResponse.json({ success: true })
      } catch (error) {
        console.error("Error logging client error:", error)

        // Still return success to client to avoid cascading errors
        return NextResponse.json({ success: false, error: "Failed to log error" }, { status: 500 })
      }
    },
    {
      limit: 20,
      windowMs: 60 * 1000, // 1 minute
      keyGenerator: (req) => req.headers.get("x-forwarded-for") || "anonymous",
    },
  ),
)
