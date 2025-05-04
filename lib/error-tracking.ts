import type React from "react"
import { logger } from "@/lib/logger"

type ErrorSeverity = "low" | "medium" | "high" | "critical"

interface ErrorMetadata {
  userId?: string
  url?: string
  component?: string
  severity?: ErrorSeverity
  tags?: Record<string, string>
  [key: string]: any
}

// In-memory error store for development and admin dashboards
const errorStore: Array<{
  error: Error
  info?: React.ErrorInfo
  metadata?: ErrorMetadata
  timestamp: Date
  id: string
}> = []

/**
 * Captures and logs errors to the configured error tracking system
 */
export function captureError(error: Error, info?: React.ErrorInfo, metadata?: ErrorMetadata): string {
  const errorId = generateErrorId()

  // Add to local store
  errorStore.push({
    error,
    info,
    metadata,
    timestamp: new Date(),
    id: errorId,
  })

  // Trim error store if it gets too large
  if (errorStore.length > 100) {
    errorStore.shift()
  }

  // Log to our logging system
  logger.error(`Error captured: ${error.message}`, {
    errorId,
    stack: error.stack,
    componentStack: info?.componentStack,
    ...metadata,
  })

  // In production, send to error tracking service
  if (process.env.NODE_ENV === "production") {
    try {
      // Send to server-side error logging endpoint
      fetch("/api/log-error", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: errorId,
          message: error.message,
          stack: error.stack,
          componentStack: info?.componentStack,
          metadata,
          timestamp: new Date().toISOString(),
        }),
        // Use keepalive to ensure the request completes even if the page is unloading
        keepalive: true,
      }).catch((e) => {
        // Silently fail if the error logging endpoint is unavailable
        console.error("Failed to send error to logging endpoint:", e)
      })
    } catch (e) {
      // Ensure error tracking never throws its own errors
      console.error("Error in error tracking:", e)
    }
  }

  return errorId
}

/**
 * Retrieves recent errors (for admin dashboards)
 */
export function getRecentErrors(limit = 10): Array<{
  error: Error
  info?: React.ErrorInfo
  metadata?: ErrorMetadata
  timestamp: Date
  id: string
}> {
  return [...errorStore].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit)
}

/**
 * Clears the error store (for testing/development)
 */
export function clearErrorStore(): void {
  errorStore.length = 0
}

/**
 * Generates a unique ID for each error
 */
function generateErrorId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

/**
 * Global error handler for unhandled exceptions and rejections
 */
export function setupGlobalErrorHandlers(): void {
  if (typeof window !== "undefined") {
    // Handle uncaught exceptions
    window.addEventListener("error", (event) => {
      captureError(event.error || new Error(event.message), undefined, {
        severity: "high",
        url: window.location.href,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      })
    })

    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))

      captureError(error, undefined, {
        severity: "high",
        url: window.location.href,
        type: "unhandledrejection",
      })
    })
  }
}

/**
 * Wraps an async function with error tracking
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  metadata?: Omit<ErrorMetadata, "severity">,
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args)
    } catch (error) {
      captureError(error instanceof Error ? error : new Error(String(error)), undefined, {
        ...metadata,
        severity: "high",
      })
      throw error
    }
  }
}
