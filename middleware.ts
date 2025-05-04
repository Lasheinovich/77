import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// For production, consider moving this to Redis or another distributed store 
// using the upstash/redis or ioredis libraries
interface RateLimitData {
  count: number;
  resetTime: number;
}

const rateLimitStore: Record<string, RateLimitData> = {}

// Rate limit configuration - consider moving to environment variables
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || "100", 10)
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10) // 1 minute window

// CSRF protection configuration
const CSRF_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH']
const CSRF_HEADER = 'x-csrf-token'
const CSRF_COOKIE = 'ark7-csrf-token'

// Content Security Policy
const getCSP = () => {
  const policy = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*.vercel-insights.com", "https://*.sentry.io"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", "data:", "blob:", "https://*.cloudfront.net", "https://*.ark7.com", "https://*.globalarkacademy.org"],
    'font-src': ["'self'", "data:"],
    'connect-src': [
      "'self'",
      "https://*.vercel-insights.com",
      "https://*.sentry.io",
      "https://*.supabase.co",
      "wss://*.supabase.co",
      "https://*.ark7.com",
      "https://*.globalarkacademy.org"
    ],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-src': ["'self'", "https://*.stripe.com"],
    'object-src': ["'none'"],
    'media-src': ["'self'"],
  };

  return Object.entries(policy)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
};

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Skip middleware for static assets and public files
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/static") ||
    request.nextUrl.pathname.startsWith("/public") ||
    request.nextUrl.pathname.startsWith("/favicon.ico") ||
    request.nextUrl.pathname.endsWith(".svg") ||
    request.nextUrl.pathname.endsWith(".png") ||
    request.nextUrl.pathname.endsWith(".jpg") ||
    request.nextUrl.pathname.endsWith(".jpeg") ||
    request.nextUrl.pathname.endsWith(".ico")
  ) {
    return response
  }

  // Apply robust security headers to all responses
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Content-Security-Policy", getCSP())
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none")
  response.headers.set("Cross-Origin-Embedder-Policy", "require-corp")
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin")
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self), interest-cohort=()")

  // Add server timing header for performance transparency
  const startTime = Date.now()

  // Apply rate limiting for API routes
  if (request.nextUrl.pathname.startsWith("/api")) {
    // Get client identifier - prefer client IP but fall back to User-Agent if needed
    const ip = request.ip ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'anonymous'

    // Add route to rate limit key to prevent global limits
    const key = `${ip}:${request.nextUrl.pathname}`
    const now = Date.now()

    // Initialize or reset if window has passed
    if (!rateLimitStore[key] || now > rateLimitStore[key].resetTime) {
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW_MS,
      }
    } else {
      // Increment count
      rateLimitStore[key].count++

      // Check if over limit
      if (rateLimitStore[key].count > RATE_LIMIT_MAX) {
        // Add Server-Timing header for debugging
        const processingTime = Date.now() - startTime

        return new NextResponse(
          JSON.stringify({
            error: "Too many requests",
            message: "Rate limit exceeded. Please try again later.",
            retryAfter: Math.ceil((rateLimitStore[key].resetTime - now) / 1000),
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": `${Math.ceil((rateLimitStore[key].resetTime - now) / 1000)}`,
              "Server-Timing": `middleware;dur=${processingTime}`,
            },
          },
        )
      }
    }

    // CSRF Protection for state-changing methods
    if (CSRF_METHODS.includes(request.method)) {
      const csrfToken = request.headers.get(CSRF_HEADER)
      const csrfCookie = request.cookies.get(CSRF_COOKIE)

      // Additional protection against timing attacks by using constant-time comparison
      const safeCompare = (a?: string, b?: string) => {
        if (!a || !b) return false
        if (a.length !== b.length) return false

        let result = 0
        for (let i = 0; i < a.length; i++) {
          result |= a.charCodeAt(i) ^ b.charCodeAt(i)
        }
        return result === 0
      }

      if (!csrfToken || !csrfCookie || !safeCompare(csrfToken, csrfCookie.value)) {
        // Add Server-Timing header for debugging
        const processingTime = Date.now() - startTime

        return new NextResponse(
          JSON.stringify({
            error: "Invalid CSRF token",
            message: "CSRF token validation failed. Please refresh the page and try again.",
          }),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
              "Server-Timing": `middleware;dur=${processingTime}`,
            },
          },
        )
      }
    }

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", RATE_LIMIT_MAX.toString())
    response.headers.set("X-RateLimit-Remaining", Math.max(0, RATE_LIMIT_MAX - rateLimitStore[key].count).toString())
    response.headers.set("X-RateLimit-Reset", Math.ceil(rateLimitStore[key].resetTime / 1000).toString())
  }

  // Clean up expired rate limits periodically (1% chance per request)
  if (Math.random() < 0.01) {
    const now = Date.now()
    for (const [key, value] of Object.entries(rateLimitStore)) {
      if (now > value.resetTime) {
        delete rateLimitStore[key]
      }
    }
  }

  // Add Server-Timing header for performance transparency
  const processingTime = Date.now() - startTime
  response.headers.set("Server-Timing", `middleware;dur=${processingTime}`)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder contents
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
