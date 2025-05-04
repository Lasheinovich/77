import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

interface DynamicRoute {
  id: string
  path: string
  component: string
  layout: string
  access: "public" | "authenticated" | "admin" | "premium"
  metadata: {
    title?: string
    description?: string
    keywords?: string[]
    [key: string]: string | string[] | number | boolean | null | undefined
  }
  params?: Record<string, string>
  created_at: string
  updated_at: string
}

// Cache for dynamic routes
let routesCache: DynamicRoute[] | null = null
let lastCacheTime = 0
const CACHE_TTL = 60 * 1000 // 1 minute

/**
 * Get all dynamic routes
 */
export async function getDynamicRoutes(): Promise<DynamicRoute[]> {
  try {
    const now = Date.now()

    // Return cached routes if available and not expired
    if (routesCache && now - lastCacheTime < CACHE_TTL) {
      return routesCache
    }

    // Fetch routes from database
    const { data, error } = await db.from("dynamic_routes").select("*").order("path", { ascending: true })

    if (error) {
      throw error
    }

    // Update cache
    routesCache = data
    lastCacheTime = now

    return data
  } catch (error) {
    logger.error("Failed to fetch dynamic routes", { error })
    // Return empty array on error
    return []
  }
}

/**
 * Get a dynamic route by path
 */
export async function getDynamicRouteByPath(path: string): Promise<DynamicRoute | null> {
  try {
    // Get all routes
    const routes = await getDynamicRoutes()

    // Find exact match
    const exactMatch = routes.find((route) => route.path === path)
    if (exactMatch) {
      return exactMatch
    }

    // Find dynamic route match (e.g., /blog/:slug)
    for (const route of routes) {
      if (route.path.includes(":")) {
        const routeParts = route.path.split("/")
        const pathParts = path.split("/")

        if (routeParts.length !== pathParts.length) {
          continue
        }

        let isMatch = true
        const params: Record<string, string> = {}

        for (let i = 0; i < routeParts.length; i++) {
          if (routeParts[i].startsWith(":")) {
            // Extract parameter
            const paramName = routeParts[i].substring(1)
            params[paramName] = pathParts[i]
          } else if (routeParts[i] !== pathParts[i]) {
            isMatch = false
            break
          }
        }

        if (isMatch) {
          return {
            ...route,
            params,
          }
        }
      }
    }

    return null
  } catch (error) {
    logger.error("Failed to get dynamic route by path", { error, path })
    return null
  }
}

/**
 * Create a new dynamic route
 */
export async function createDynamicRoute(
  route: Omit<DynamicRoute, "id" | "created_at" | "updated_at">,
): Promise<DynamicRoute | null> {
  try {
    const now = new Date().toISOString()

    const { data, error } = await db
      .from("dynamic_routes")
      .insert({
        ...route,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Invalidate cache
    routesCache = null

    return data
  } catch (error) {
    logger.error("Failed to create dynamic route", { error, route })
    return null
  }
}

/**
 * Update a dynamic route
 */
export async function updateDynamicRoute(
  id: string,
  route: Partial<Omit<DynamicRoute, "id" | "created_at" | "updated_at">>,
): Promise<DynamicRoute | null> {
  try {
    const { data, error } = await db
      .from("dynamic_routes")
      .update({
        ...route,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Invalidate cache
    routesCache = null

    return data
  } catch (error) {
    logger.error("Failed to update dynamic route", { error, id, route })
    return null
  }
}

/**
 * Delete a dynamic route
 */
export async function deleteDynamicRoute(id: string): Promise<boolean> {
  try {
    const { error } = await db.from("dynamic_routes").delete().eq("id", id)

    if (error) {
      throw error
    }

    // Invalidate cache
    routesCache = null

    return true
  } catch (error) {
    logger.error("Failed to delete dynamic route", { error, id })
    return false
  }
}

/**
 * Clear the routes cache
 */
export function clearRoutesCache(): void {
  routesCache = null
  lastCacheTime = 0
  logger.debug("Dynamic routes cache cleared")
}
