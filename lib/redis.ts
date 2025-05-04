import { createClient } from 'redis'
import { logger } from '@/lib/logger'

class RedisClient {
  private static instance: RedisClient
  private client: ReturnType<typeof createClient>
  private isConnected: boolean = false

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis connection failed after 10 retries')
            return new Error('Redis max retries reached')
          }
          return Math.min(retries * 100, 3000)
        },
      },
    })

    this.client.on('error', (err) => {
      logger.error('Redis client error:', err)
      this.isConnected = false
    })

    this.client.on('connect', () => {
      logger.info('Redis client connected')
      this.isConnected = true
    })

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting')
    })

    this.client.connect().catch((err) => {
      logger.error('Redis connection error:', err)
    })
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient()
    }
    return RedisClient.instance
  }

  public async get(key: string): Promise<string | null> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected')
      }
      return await this.client.get(key)
    } catch (error) {
      logger.error('Redis get error:', error)
      return null
    }
  }

  public async set(key: string, value: string, ttlMs?: number): Promise<void> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected')
      }
      if (ttlMs) {
        await this.client.set(key, value, { PX: ttlMs })
      } else {
        await this.client.set(key, value)
      }
    } catch (error) {
      logger.error('Redis set error:', error)
    }
  }

  public async increment(key: string): Promise<number> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected')
      }
      return await this.client.incr(key)
    } catch (error) {
      logger.error('Redis increment error:', error)
      return 0
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected')
      }
      await this.client.del(key)
    } catch (error) {
      logger.error('Redis delete error:', error)
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.quit()
        this.isConnected = false
        logger.info('Redis client disconnected')
      }
    } catch (error) {
      logger.error('Redis disconnect error:', error)
    }
  }
}

export const redis = RedisClient.getInstance()