import { NextResponse } from "next/server"
import { authService } from "@/lib/auth/auth-service"
import { logger } from "@/lib/logger"

export interface AuthOptions {
  required?: boolean
  roles?: string[]
  permissions?: string[]
  adminApiKeyRequired?: boolean // New option to require ADMIN_API_KEY
}

/**
 * Middleware to authenticate API requests
 */
export async function withAuth(handler: Function, options: AuthOptions = { required: true }) {
  return async (req: Request, ...args: any[]) => {
    try {
      // Check for ADMIN_API_KEY if required
      if (options.adminApiKeyRequired) {
        const adminApiKey = req.headers.get("x-admin-api-key")
        if (adminApiKey !== process.env.ADMIN_API_KEY) {
          logger.warn("Unauthorized access attempt: invalid ADMIN_API_KEY", {
            path: req.url,
          })
          return NextResponse.json({ error: "Unauthorized: Invalid ADMIN_API_KEY" }, { status: 403 })
        }
      }

      // Extract session token from cookies or authorization header
      const sessionId = getSessionToken(req)

      if (!sessionId) {
        if (options.required) {
          return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        // Continue without authentication if not required
        return handler(req, ...args)
      }

      // Validate session and get user
      const user = await authService.validateSession(sessionId)

      if (!user) {
        if (options.required) {
          return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 })
        }

        // Continue without authentication if not required
        return handler(req, ...args)
      }

      // Check role restrictions
      if (options.roles && options.roles.length > 0) {
        if (!options.roles.includes(user.role)) {
          logger.warn("Unauthorized access attempt: insufficient role", {
            userId: user.id,
            userRole: user.role,
            requiredRoles: options.roles,
            path: req.url,
          })

          return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
        }
      }

      // Check permission restrictions
      if (options.permissions && options.permissions.length > 0) {
        const hasAllPermissions = options.permissions.every((permission) => authService.hasPermission(user, permission))

        if (!hasAllPermissions) {
          logger.warn("Unauthorized access attempt: insufficient permissions", {
            userId: user.id,
            userRole: user.role,
            requiredPermissions: options.permissions,
            path: req.url,
          })

          return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
        }
      }

      // Add user to request context
      const context = { user }

      // Call the handler with the authenticated user
      return handler(req, { ...args[0], context })
    } catch (error) {
      logger.error("Authentication error", { error, url: req.url })

      return NextResponse.json({ error: "Authentication error" }, { status: 500 })
    }
  }
}

/**
 * Extract session token from request
 */
function getSessionToken(req: Request): string | null {
  // Try to get from Authorization header
  const authHeader = req.headers.get("Authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }

  // Try to get from cookie
  const cookieHeader = req.headers.get("Cookie")
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader)
    return cookies["session_token"] || null
  }

  return null
}

/**
 * Parse cookies from Cookie header
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}

  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=")
    const name = parts[0].trim()
    const value = parts.slice(1).join("=").trim()
    cookies[name] = value
  })

  return cookies
}
