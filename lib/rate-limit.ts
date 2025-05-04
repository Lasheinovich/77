import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { logger } from "@/lib/logger"

interface RateLimitOptions {
  limit: number
  windowMs: number
  keyGenerator: (req: Request) => string
  message?: string
  statusCode?: number
  headers?: boolean
}

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store for development
const rateLimitStore = new Map<string, RateLimitRecord>()

/**
 * Rate limiting middleware with Redis support for production
 */
export function withRateLimit<T extends unknown[]>(
  handler: (req: Request, ...args: T) => Promise<Response>,
  options: RateLimitOptions
) {
  const {
    limit = 100,
    windowMs = 60000,
    keyGenerator,
    message = "Too many requests, please try again later.",
    statusCode = 429,
    headers = true,
  } = options

  return async (req: Request, ...args: T): Promise<Response> => {
    const key = keyGenerator(req)
    const now = Date.now()
    const isProduction = process.env.NODE_ENV === 'production'

    try {
      let count: number
      let resetTime: number

      if (isProduction) {
        // Use Redis in production
        const redisKey = `ratelimit:${key}`
        const redisResetKey = `ratelimit:${key}:reset`

        // Get or set reset time
        let storedResetTime = await redis.get(redisResetKey)
        if (!storedResetTime || parseInt(storedResetTime) < now) {
          resetTime = now + windowMs
          await redis.set(redisResetKey, resetTime.toString(), windowMs)
          await redis.set(redisKey, '1', windowMs)
          count = 1
        } else {
          resetTime = parseInt(storedResetTime)
          count = await redis.increment(redisKey)
        }
      } else {
        // Use in-memory store in development
        let record = rateLimitStore.get(key)

        if (!record || now > record.resetTime) {
          record = {
            count: 1,
            resetTime: now + windowMs,
          }
        } else {
          record.count++
        }
        
        rateLimitStore.set(key, record)
        count = record.count
        resetTime = record.resetTime

        // Clean up expired entries periodically (1% chance)
        if (Math.random() < 0.01) {
          for (const [key, value] of rateLimitStore.entries()) {
            if (now > value.resetTime) {
              rateLimitStore.delete(key)
            }
          }
        }
      }

      // Calculate remaining requests and time until reset
      const remaining = Math.max(0, limit - count)
      const reset = Math.ceil(resetTime / 1000) // in seconds

      // Create response headers
      const responseHeaders: HeadersInit = {}
      if (headers) {
        responseHeaders["X-RateLimit-Limit"] = limit.toString()
        responseHeaders["X-RateLimit-Remaining"] = remaining.toString()
        responseHeaders["X-RateLimit-Reset"] = reset.toString()
      }

      // Check if rate limit exceeded
      if (count > limit) {
        logger.warn(`Rate limit exceeded for ${key}`, {
          limit,
          count,
          ip: req.headers.get("x-forwarded-for") || "unknown",
          url: req.url,
        })

        if (headers) {
          responseHeaders["Retry-After"] = Math.ceil((resetTime - now) / 1000).toString()
        }

        return NextResponse.json(
          { error: message },
          { status: statusCode, headers: responseHeaders }
        )
      }

      // Call the handler
      const response = await handler(req, ...args)

      // Add rate limit headers to the response
      if (headers) {
        const newResponse = NextResponse.json(
          await response.json(),
          {
            status: response.status,
            statusText: response.statusText,
            headers: {
              ...Object.fromEntries(response.headers),
              ...responseHeaders,
            },
          }
        )
        return newResponse
      }

      return response
    } catch (error) {
      logger.error('Rate limit error:', error)
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    }
  }
}

/**
 * Check if a key is rate limited without incrementing the counter
 */
export async function isRateLimited(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now()
  const isProduction = process.env.NODE_ENV === 'production'

  try {
    if (isProduction) {
      const redisKey = `ratelimit:${key}`
      const count = await redis.get(redisKey)
      return count ? parseInt(count) >= limit : false
    } else {
      const record = rateLimitStore.get(key)
      return record && now <= record.resetTime && record.count >= limit
    }
  } catch (error) {
    logger.error('Rate limit check error:', error)
    return false
  }
}

/**
 * Reset rate limit for a specific key
 */
export async function resetRateLimit(key: string): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production'

  try {
    if (isProduction) {
      await redis.delete(`ratelimit:${key}`)
      await redis.delete(`ratelimit:${key}:reset`)
    } else {
      rateLimitStore.delete(key)
    }
  } catch (error) {
    logger.error('Reset rate limit error:', error)
  }
}
