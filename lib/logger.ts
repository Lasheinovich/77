import * as Sentry from '@sentry/nextjs'

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  userId?: string
  sessionId?: string
  requestId?: string
  url?: string
  method?: string
  statusCode?: number
  duration?: number
}

interface LogOptions {
  level?: LogLevel
  tags?: Record<string, string>
  error?: Error
  context?: Record<string, any>
}

class Logger {
  private static instance: Logger
  private context: Record<string, any> = {}
  private logBuffer: LogEntry[] = []
  private flushInterval: NodeJS.Timeout | null = null
  private readonly FLUSH_INTERVAL_MS = 5000 // 5 seconds
  private readonly MAX_BUFFER_SIZE = 100
  private readonly MAX_CONTEXT_DEPTH = 3
  private readonly MAX_CONTEXT_SIZE = 10000 // characters

  private constructor() {
    this.setDefaultContext()
    // Initialize flush interval in browser environment
    if (typeof window !== "undefined") {
      this.flushInterval = setInterval(() => this.flush(), this.FLUSH_INTERVAL_MS)

      // Flush logs before page unload
      window.addEventListener("beforeunload", () => this.flush())
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private setDefaultContext() {
    this.context = {
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_VERSION,
      service: 'ark7-frontend'
    }
  }

  private formatMessage(message: string, options?: LogOptions): string {
    const timestamp = new Date().toISOString()
    const level = options?.level || 'info'
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`
  }

  private enrichContext(options?: LogOptions): Record<string, any> {
    return {
      ...this.context,
      ...options?.context,
      tags: options?.tags,
    }
  }

  public setContext(context: Record<string, any>): void {
    this.context = {
      ...this.context,
      ...context,
    }
  }

  public clearContext(): void {
    this.setDefaultContext()
  }

  private log(message: string, options?: LogOptions): void {
    const formattedMessage = this.formatMessage(message, options)
    const enrichedContext = this.enrichContext(options)

    // Console logging
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = options?.level || 'info'
      console[consoleMethod](formattedMessage, enrichedContext)
    }

    // Sentry logging for warnings and errors
    if (options?.level === 'warn' || options?.level === 'error') {
      if (options.error) {
        Sentry.captureException(options.error, {
          extra: enrichedContext,
          tags: options.tags,
        })
      } else {
        Sentry.captureMessage(message, {
          level: options.level === 'warn' ? 'warning' : 'error',
          extra: enrichedContext,
          tags: options.tags,
        })
      }
    }

    // Add analytics event in production
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      if ((window as any).gtag) {
        (window as any).gtag('event', 'log_event', {
          event_category: options?.level || 'info',
          event_label: message,
          ...enrichedContext,
        })
      }
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message} ${
      entry.context ? JSON.stringify(this.sanitizeContext(entry.context)) : ""
    }`
  }

  private sanitizeContext(context: Record<string, any>, depth = 0): Record<string, any> {
    if (depth >= this.MAX_CONTEXT_DEPTH) {
      return { _truncated: true }
    }

    const result: Record<string, any> = {}

    for (const [key, value] of Object.entries(context)) {
      // Skip sensitive keys
      if (this.isSensitiveKey(key)) {
        result[key] = "[REDACTED]"
        continue
      }

      if (value === null || value === undefined) {
        result[key] = value
      } else if (typeof value === "object") {
        if (Array.isArray(value)) {
          result[key] =
            value.length > 10
              ? [...value.slice(0, 10), `... (${value.length - 10} more items)`]
              : value.map((item) =>
                  typeof item === "object" && item !== null ? this.sanitizeContext(item, depth + 1) : item,
                )
        } else {
          result[key] = this.sanitizeContext(value, depth + 1)
        }
      } else if (typeof value === "string" && value.length > 1000) {
        result[key] = value.substring(0, 1000) + "... (truncated)"
      } else {
        result[key] = value
      }
    }

    return result
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      "password",
      "token",
      "secret",
      "key",
      "auth",
      "credential",
      "jwt",
      "apiKey",
      "api_key",
      "accessToken",
      "access_token",
      "refreshToken",
      "refresh_token",
      "private",
      "ssn",
      "creditCard",
      "credit_card",
    ]

    return sensitiveKeys.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))
  }

  private addToBuffer(entry: LogEntry): void {
    // Ensure context size is reasonable
    if (entry.context) {
      const contextStr = JSON.stringify(entry.context)
      if (contextStr.length > this.MAX_CONTEXT_SIZE) {
        entry.context = {
          _truncated: true,
          _originalSize: contextStr.length,
          message: "Context was too large and has been truncated",
        }
      }
    }

    this.logBuffer.push(entry)

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      const formattedEntry = this.formatLogEntry(entry)
      switch (entry.level) {
        case "debug":
          console.debug(formattedEntry)
          break
        case "info":
          console.info(formattedEntry)
          break
        case "warn":
          console.warn(formattedEntry)
          break
        case "error":
        case "critical":
          console.error(formattedEntry)
          break
      }
    }

    // Flush immediately for critical errors or if buffer is full
    if (entry.level === "critical" || this.logBuffer.length >= this.MAX_BUFFER_SIZE) {
      this.flush()
    }
  }

  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return

    const logsToSend = [...this.logBuffer]
    this.logBuffer = []

    // In production, send logs to server
    if (process.env.NODE_ENV === "production" && typeof fetch !== "undefined") {
      try {
        await fetch("/api/logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ logs: logsToSend }),
          // Use keepalive to ensure logs are sent even if page is unloading
          keepalive: true,
        })
      } catch (error) {
        // If sending fails, add back to buffer (but avoid infinite loop)
        if (logsToSend.length <= this.MAX_BUFFER_SIZE / 2) {
          this.logBuffer = [...logsToSend, ...this.logBuffer]
        }
        console.error("Failed to send logs:", error)
      }
    }
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    // Get request-specific information if available
    let requestInfo: Partial<LogEntry> = {}

    if (typeof window !== "undefined") {
      requestInfo = {
        url: window.location.href,
        sessionId: localStorage.getItem("sessionId") || undefined,
        userId: localStorage.getItem("userId") || undefined,
      }
    }

    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      ...requestInfo,
    }
  }

  public debug(message: string, context?: Record<string, any>): void {
    this.log(message, { level: 'debug', context })
    this.addToBuffer(this.createLogEntry("debug", message, context))
  }

  public info(message: string, context?: Record<string, any>): void {
    this.log(message, { level: 'info', context })
    this.addToBuffer(this.createLogEntry("info", message, context))
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.log(message, { level: 'warn', context })
    this.addToBuffer(this.createLogEntry("warn", message, context))
  }

  public error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(message, {
      level: 'error',
      error,
      context: {
        ...context,
        stack: error?.stack,
      },
    })
    this.addToBuffer(this.createLogEntry("error", message, context))
  }

  public critical(message: string, context?: Record<string, any>): void {
    this.addToBuffer(this.createLogEntry("critical", message, context))
  }

  // Log HTTP request (for API routes)
  public logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userId?: string,
    requestId?: string,
    context?: Record<string, any>,
  ): void {
    const level: LogLevel = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info"

    this.addToBuffer({
      timestamp: new Date().toISOString(),
      level,
      message: `${method} ${url} ${statusCode} ${duration}ms`,
      context,
      userId,
      requestId,
      url,
      method,
      statusCode,
      duration,
    })
  }

  // Clean up resources
  public dispose(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    this.flush()
  }

  public withContext(context: Record<string, any>): Logger {
    const logger = new Logger()
    logger.setContext({
      ...this.context,
      ...context,
    })
    return logger
  }

  public async withTimer<T>(
    message: string,
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const start = performance.now()
    try {
      const result = await operation()
      const duration = performance.now() - start
      this.info(`${message} completed in ${duration.toFixed(2)}ms`, {
        ...context,
        duration,
      })
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.error(`${message} failed after ${duration.toFixed(2)}ms`, error as Error, {
        ...context,
        duration,
      })
      throw error
    }
  }
}

export const logger = Logger.getInstance()

// Create a request logger middleware for API routes
export function withLogging(handler: Function) {
  return async (req: Request, ...args: any[]) => {
    const startTime = performance.now()
    const requestId = crypto.randomUUID()
    const method = req.method
    const url = req.url

    try {
      const response = await handler(req, ...args)
      const duration = Math.round(performance.now() - startTime)

      logger.logRequest(
        method,
        url,
        response.status,
        duration,
        undefined, // userId would be extracted from auth in a real implementation
        requestId,
      )

      return response
    } catch (error) {
      const duration = Math.round(performance.now() - startTime)

      logger.logRequest(method, url, 500, duration, undefined, requestId, {
        error: error instanceof Error ? error.message : String(error),
      })

      throw error
    }
  }
}

// Decorator for method logging
export function logMethod(options: LogOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const methodName = `${target.constructor.name}.${propertyKey}`
      const context = {
        method: methodName,
        args: args.map(arg => 
          typeof arg === 'object' ? '[Object]' : String(arg)
        ).join(', '),
        ...options.context,
      }

      try {
        logger.debug(`${methodName} called`, context)
        const result = await originalMethod.apply(this, args)
        logger.debug(`${methodName} completed`, context)
        return result
      } catch (error) {
        logger.error(`${methodName} failed`, error as Error, context)
        throw error
      }
    }

    return descriptor
  }
}
