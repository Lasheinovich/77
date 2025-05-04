type CacheValue = any
type ExpiryTime = number | null // null means no expiry

interface CacheEntry {
  value: CacheValue
  expiry: ExpiryTime
  createdAt: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  staleWhileRevalidate?: boolean // Return stale data while fetching fresh data
}

class CacheManager {
  private static instance: CacheManager
  private cache: Map<string, CacheEntry> = new Map()
  private revalidationPromises: Map<string, Promise<any>> = new Map()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  private constructor() {
    // Set up periodic cleanup of expired items
    if (typeof setInterval !== "undefined") {
      setInterval(() => this.cleanup(), 60 * 1000) // Run every minute
    }
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: CacheValue, options: CacheOptions = {}): void {
    const ttl = options.ttl ?? this.DEFAULT_TTL
    const expiry = ttl ? Date.now() + ttl : null

    this.cache.set(key, {
      value,
      expiry,
      createdAt: Date.now(),
    })
  }

  /**
   * Get a value from the cache
   */
  get(key: string): CacheValue | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if entry is expired
    if (entry.expiry && Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  /**
   * Get a value with automatic revalidation
   */
  async getOrFetch(key: string, fetchFn: () => Promise<CacheValue>, options: CacheOptions = {}): Promise<CacheValue> {
    const cachedValue = this.get(key)
    const ttl = options.ttl ?? this.DEFAULT_TTL
    const staleWhileRevalidate = options.staleWhileRevalidate ?? false

    // If we have a valid cached value, return it
    if (cachedValue !== null) {
      const entry = this.cache.get(key)!

      // Check if we need to revalidate in the background
      if (entry.expiry && Date.now() > entry.expiry && staleWhileRevalidate) {
        // Only start revalidation if not already in progress
        if (!this.revalidationPromises.has(key)) {
          const revalidationPromise = this.revalidate(key, fetchFn, options)
          this.revalidationPromises.set(key, revalidationPromise)

          // Clean up promise when done
          revalidationPromise.finally(() => {
            this.revalidationPromises.delete(key)
          })
        }

        // Return stale data while revalidating
        return cachedValue
      }

      return cachedValue
    }

    // If no cached value or expired, fetch fresh data
    try {
      // Check if we already have a fetch in progress
      if (this.revalidationPromises.has(key)) {
        return await this.revalidationPromises.get(key)!
      }

      // Start new fetch
      const fetchPromise = fetchFn()
      this.revalidationPromises.set(key, fetchPromise)

      const value = await fetchPromise

      // Cache the result
      this.set(key, value, { ttl })

      return value
    } catch (error) {
      // If fetch fails, return null
      console.error(`Cache fetch error for key ${key}:`, error)
      return null
    } finally {
      // Clean up promise
      this.revalidationPromises.delete(key)
    }
  }

  /**
   * Revalidate a cache entry
   */
  private async revalidate(
    key: string,
    fetchFn: () => Promise<CacheValue>,
    options: CacheOptions = {},
  ): Promise<CacheValue> {
    try {
      const value = await fetchFn()
      this.set(key, value, options)
      return value
    } catch (error) {
      console.error(`Cache revalidation error for key ${key}:`, error)
      throw error
    }
  }

  /**
   * Delete a value from the cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all values from the cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Check if a key exists in the cache
   */
  has(key: string): boolean {
    if (!this.cache.has(key)) {
      return false
    }

    const entry = this.cache.get(key)!

    // Check if entry is expired
    if (entry.expiry && Date.now() > entry.expiry) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Get cache stats
   */
  getStats(): {
    size: number
    keys: string[]
    expiringKeys: number
    averageAge: number
  } {
    const now = Date.now()
    let totalAge = 0
    let expiringKeys = 0

    const keys = Array.from(this.cache.keys())

    for (const key of keys) {
      const entry = this.cache.get(key)!
      totalAge += now - entry.createdAt

      if (entry.expiry) {
        expiringKeys++
      }
    }

    return {
      size: this.cache.size,
      keys,
      expiringKeys,
      averageAge: this.cache.size ? totalAge / this.cache.size : 0,
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    let deletedCount = 0

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry && now > entry.expiry) {
        this.cache.delete(key)
        deletedCount++
      }
    }

    if (deletedCount > 0) {
      console.log(`Cache cleanup: removed ${deletedCount} expired entries`)
    }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance()
