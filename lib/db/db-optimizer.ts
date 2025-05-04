import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

interface QueryStats {
  query: string
  count: number
  totalTime: number
  averageTime: number
  slowestTime: number
  fastestTime: number
}

class DatabaseOptimizer {
  private static instance: DatabaseOptimizer
  private queryStats: Map<string, QueryStats> = new Map()
  private slowQueries: { query: string; time: number; timestamp: Date }[] = []
  private readonly SLOW_QUERY_THRESHOLD = 500 // ms

  private constructor() {}

  public static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer()
    }
    return DatabaseOptimizer.instance
  }

  /**
   * Execute a query with performance monitoring
   */
  async executeQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
    const startTime = performance.now()

    try {
      return await queryFn()
    } finally {
      const endTime = performance.now()
      const duration = endTime - startTime

      this.recordQueryStats(queryName, duration)

      // Log slow queries
      if (duration > this.SLOW_QUERY_THRESHOLD) {
        this.recordSlowQuery(queryName, duration)
      }
    }
  }

  /**
   * Record query statistics
   */
  private recordQueryStats(query: string, time: number): void {
    if (!this.queryStats.has(query)) {
      this.queryStats.set(query, {
        query,
        count: 0,
        totalTime: 0,
        averageTime: 0,
        slowestTime: 0,
        fastestTime: Number.MAX_VALUE,
      })
    }

    const stats = this.queryStats.get(query)!

    stats.count++
    stats.totalTime += time
    stats.averageTime = stats.totalTime / stats.count
    stats.slowestTime = Math.max(stats.slowestTime, time)
    stats.fastestTime = Math.min(stats.fastestTime, time)
  }

  /**
   * Record a slow query
   */
  private recordSlowQuery(query: string, time: number): void {
    this.slowQueries.push({
      query,
      time,
      timestamp: new Date(),
    })

    // Keep only the last 100 slow queries
    if (this.slowQueries.length > 100) {
      this.slowQueries.shift()
    }

    logger.warn(`Slow query detected: ${query}`, { duration: time })
  }

  /**
   * Get query statistics
   */
  getQueryStats(): QueryStats[] {
    return Array.from(this.queryStats.values())
  }

  /**
   * Get slow queries
   */
  getSlowQueries(): { query: string; time: number; timestamp: Date }[] {
    return [...this.slowQueries]
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.queryStats.clear()
    this.slowQueries = []
  }

  /**
   * Analyze database performance
   */
  async analyzeDatabasePerformance(): Promise<{
    tables: { name: string; rowCount: number; size: string }[]
    slowQueries: { query: string; time: number; timestamp: Date }[]
    recommendations: string[]
  }> {
    try {
      // This is a simplified version - in a real implementation,
      // you would use database-specific queries to get table statistics

      // Get table information
      const { data: tables, error } = await db
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")

      if (error) {
        throw error
      }

      const tableStats = []
      const recommendations = []

      // For each table, get row count and size
      for (const table of tables) {
        const tableName = table.table_name

        // Get row count
        const { count, error: countError } = await db.from(tableName).select("*", { count: "exact", head: true })

        if (countError) {
          logger.error(`Error getting row count for table ${tableName}`, { error: countError })
          continue
        }

        tableStats.push({
          name: tableName,
          rowCount: count || 0,
          size: "Unknown", // In a real implementation, you would get the actual size
        })

        // Generate recommendations based on row count
        if (count && count > 10000) {
          recommendations.push(`Consider adding indexes to table ${tableName} for better performance`)
        }
      }

      // Add recommendations based on slow queries
      if (this.slowQueries.length > 0) {
        const slowQueriesByType = new Map<string, number>()

        for (const { query } of this.slowQueries) {
          slowQueriesByType.set(query, (slowQueriesByType.get(query) || 0) + 1)
        }

        for (const [query, count] of slowQueriesByType.entries()) {
          if (count > 5) {
            recommendations.push(`Optimize slow query: ${query} (occurred ${count} times)`)
          }
        }
      }

      return {
        tables: tableStats,
        slowQueries: this.getSlowQueries(),
        recommendations,
      }
    } catch (error) {
      logger.error("Error analyzing database performance", { error })
      throw error
    }
  }
}

// Export singleton instance
export const dbOptimizer = DatabaseOptimizer.getInstance()

/**
 * Enhanced database client with performance monitoring
 */
export const optimizedDb = {
  from: (table: string) => {
    const originalFrom = db.from(table)

    // Wrap methods with performance monitoring
    return {
      ...originalFrom,
      select: (...args: any[]) => {
        const query = originalFrom.select(...args)

        // Wrap the execution methods
        const originalThen = query.then.bind(query)
        query.then = (onfulfilled, onrejected) => {
          return dbOptimizer.executeQuery(`SELECT FROM ${table}`, () => originalThen(onfulfilled, onrejected))
        }

        return query
      },
      insert: (values: any, options?: any) => {
        const query = originalFrom.insert(values, options)

        // Wrap the execution methods
        const originalThen = query.then.bind(query)
        query.then = (onfulfilled, onrejected) => {
          return dbOptimizer.executeQuery(`INSERT INTO ${table}`, () => originalThen(onfulfilled, onrejected))
        }

        return query
      },
      update: (values: any, options?: any) => {
        const query = originalFrom.update(values, options)

        // Wrap the execution methods
        const originalThen = query.then.bind(query)
        query.then = (onfulfilled, onrejected) => {
          return dbOptimizer.executeQuery(`UPDATE ${table}`, () => originalThen(onfulfilled, onrejected))
        }

        return query
      },
      delete: (options?: any) => {
        const query = originalFrom.delete(options)

        // Wrap the execution methods
        const originalThen = query.then.bind(query)
        query.then = (onfulfilled, onrejected) => {
          return dbOptimizer.executeQuery(`DELETE FROM ${table}`, () => originalThen(onfulfilled, onrejected))
        }

        return query
      },
    }
  },
}
