import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { captureError } from "@/lib/error-tracking"

export interface User {
  id: string
  email: string
  username: string
  role: "user" | "admin" | "moderator" | "partner"
  subscription_status?: "active" | "inactive" | "trial"
  created_at: string
  updated_at: string
  last_login?: string
  profile?: {
    name?: string
    avatar_url?: string
    bio?: string
    [key: string]: any
  }
  settings?: Record<string, any>
  metadata?: Record<string, any>
}

export interface Session {
  id: string
  user_id: string
  expires_at: string
  created_at: string
  last_active_at: string
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, any>
}

export interface LoginResult {
  success: boolean
  user?: User
  session?: Session
  error?: string
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

class AuthService {
  /**
   * Login a user with email and password
   */
  async login(email: string, password: string, metadata?: Record<string, any>): Promise<LoginResult> {
    try {
      // In a real implementation, this would use Supabase auth
      // For now, we'll simulate the login process

      // Check if user exists
      const { data: user, error: userError } = await db
        .from("users")
        .select("*")
        .eq("email", email.toLowerCase())
        .single()

      if (userError || !user) {
        logger.warn("Login failed: User not found", { email })
        return {
          success: false,
          error: "Invalid email or password",
        }
      }

      // In a real implementation, we would verify the password
      // For now, we'll assume it's correct

      // Create a new session
      const sessionId = crypto.randomUUID()
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

      const { error: sessionError } = await db.from("sessions").insert({
        id: sessionId,
        user_id: user.id,
        expires_at: expiresAt.toISOString(),
        created_at: now.toISOString(),
        last_active_at: now.toISOString(),
        ip_address: metadata?.ip_address,
        user_agent: metadata?.user_agent,
        metadata,
      })

      if (sessionError) {
        logger.error("Failed to create session", { error: sessionError, userId: user.id })
        return {
          success: false,
          error: "Failed to create session",
        }
      }

      // Update user's last login
      await db
        .from("users")
        .update({
          last_login: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", user.id)

      logger.info("User logged in successfully", { userId: user.id })

      return {
        success: true,
        user,
        session: {
          id: sessionId,
          user_id: user.id,
          expires_at: expiresAt.toISOString(),
          created_at: now.toISOString(),
          last_active_at: now.toISOString(),
          ip_address: metadata?.ip_address,
          user_agent: metadata?.user_agent,
          metadata,
        },
      }
    } catch (error) {
      logger.error("Login error", { error, email })
      captureError(error instanceof Error ? error : new Error(String(error)), undefined, {
        component: "AuthService",
        operation: "login",
        email,
      })

      return {
        success: false,
        error: "An error occurred during login",
      }
    }
  }

  /**
   * Register a new user
   */
  async register(
    email: string,
    password: string,
    username: string,
    metadata?: Record<string, any>,
  ): Promise<AuthResult> {
    try {
      // Check if email already exists
      const { data: existingEmail } = await db.from("users").select("id").eq("email", email.toLowerCase()).maybeSingle()

      if (existingEmail) {
        return {
          success: false,
          error: "Email already in use",
        }
      }

      // Check if username already exists
      const { data: existingUsername } = await db.from("users").select("id").eq("username", username).maybeSingle()

      if (existingUsername) {
        return {
          success: false,
          error: "Username already in use",
        }
      }

      // In a real implementation, we would hash the password
      // For now, we'll assume it's already handled

      // Create the user
      const userId = crypto.randomUUID()
      const now = new Date().toISOString()

      const { error: userError } = await db.from("users").insert({
        id: userId,
        email: email.toLowerCase(),
        username,
        role: "user",
        subscription_status: "inactive",
        created_at: now,
        updated_at: now,
        profile: {
          name: username,
        },
        settings: {
          theme: "system",
          notifications: true,
        },
        metadata,
      })

      if (userError) {
        logger.error("Failed to create user", { error: userError, email })
        return {
          success: false,
          error: "Failed to create user",
        }
      }

      logger.info("User registered successfully", { userId })

      return {
        success: true,
        user: {
          id: userId,
          email: email.toLowerCase(),
          username,
          role: "user",
          subscription_status: "inactive",
          created_at: now,
          updated_at: now,
          profile: {
            name: username,
          },
          settings: {
            theme: "system",
            notifications: true,
          },
          metadata,
        },
      }
    } catch (error) {
      logger.error("Registration error", { error, email })
      captureError(error instanceof Error ? error : new Error(String(error)), undefined, {
        component: "AuthService",
        operation: "register",
        email,
      })

      return {
        success: false,
        error: "An error occurred during registration",
      }
    }
  }

  /**
   * Logout a user by invalidating their session
   */
  async logout(sessionId: string): Promise<boolean> {
    try {
      const { error } = await db.from("sessions").delete().eq("id", sessionId)

      if (error) {
        logger.error("Failed to delete session", { error, sessionId })
        return false
      }

      logger.info("User logged out successfully", { sessionId })
      return true
    } catch (error) {
      logger.error("Logout error", { error, sessionId })
      captureError(error instanceof Error ? error : new Error(String(error)), undefined, {
        component: "AuthService",
        operation: "logout",
        sessionId,
      })

      return false
    }
  }

  /**
   * Get a user by their ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await db.from("users").select("*").eq("id", userId).single()

      if (error || !data) {
        logger.warn("User not found", { userId })
        return null
      }

      return data
    } catch (error) {
      logger.error("Error fetching user", { error, userId })
      captureError(error instanceof Error ? error : new Error(String(error)), undefined, {
        component: "AuthService",
        operation: "getUserById",
        userId,
      })

      return null
    }
  }

  /**
   * Get a session by its ID
   */
  async getSessionById(sessionId: string): Promise<Session | null> {
    try {
      const { data, error } = await db.from("sessions").select("*").eq("id", sessionId).single()

      if (error || !data) {
        logger.warn("Session not found", { sessionId })
        return null
      }

      // Check if session is expired
      if (new Date(data.expires_at) < new Date()) {
        logger.info("Session expired", { sessionId })

        // Delete expired session
        await db.from("sessions").delete().eq("id", sessionId)

        return null
      }

      return data
    } catch (error) {
      logger.error("Error fetching session", { error, sessionId })
      captureError(error instanceof Error ? error : new Error(String(error)), undefined, {
        component: "AuthService",
        operation: "getSessionById",
        sessionId,
      })

      return null
    }
  }

  /**
   * Validate a session and return the associated user
   */
  async validateSession(sessionId: string): Promise<User | null> {
    try {
      const session = await this.getSessionById(sessionId)

      if (!session) {
        return null
      }

      // Update last active timestamp
      await db
        .from("sessions")
        .update({
          last_active_at: new Date().toISOString(),
        })
        .eq("id", sessionId)

      // Get the user
      return await this.getUserById(session.user_id)
    } catch (error) {
      logger.error("Error validating session", { error, sessionId })
      captureError(error instanceof Error ? error : new Error(String(error)), undefined, {
        component: "AuthService",
        operation: "validateSession",
        sessionId,
      })

      return null
    }
  }

  /**
   * Check if a user has a specific permission
   */
  hasPermission(user: User, permission: string): boolean {
    // Define role-based permissions
    const rolePermissions: Record<string, string[]> = {
      admin: ["*"], // Admin has all permissions
      moderator: ["content.read", "content.create", "content.update", "users.read"],
      partner: ["content.read", "content.create"],
      user: ["content.read"],
    }

    // Check if user's role has the permission
    if (user.role === "admin") {
      return true // Admin has all permissions
    }

    const userPermissions = rolePermissions[user.role] || []
    return userPermissions.includes(permission) || userPermissions.includes("*")
  }
}

// Export singleton instance
export const authService = new AuthService()
