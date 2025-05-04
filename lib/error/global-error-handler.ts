import { captureError } from "@/lib/error-tracking"
import { logger } from "@/lib/logger"

interface ErrorHandlerOptions {
  silent?: boolean
  rethrow?: boolean
  context?: Record<string, any>
  severity?: "low" | "medium" | "high" | "critical"
}

/**
 * Global error handler function
 */
export function handleError(error: unknown, options: ErrorHandlerOptions = {}): void {
  const { silent = false, rethrow = false, context = {}, severity = "medium" } = options

  // Convert to Error object if needed
  const errorObject = error instanceof Error ? error : new Error(String(error))

  // Log the error
  if (!silent) {
    if (severity === "critical") {
      logger.critical(errorObject.message, {
        error: errorObject,
        stack: errorObject.stack,
        ...context,
      })
    } else {
      logger.error(errorObject.message, {
        error: errorObject,
        stack: errorObject.stack,
        ...context,
      })
    }
  }

  // Capture in error tracking system
  captureError(errorObject, undefined, {
    ...context,
    severity,
  })

  // Rethrow if needed
  if (rethrow) {
    throw errorObject
  }
}

/**
 * Wrap a function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  options: ErrorHandlerOptions = {},
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    try {
      const result = fn(...args)

      // Handle promises
      if (result instanceof Promise) {
        return result.catch((error) => {
          handleError(error, {
            ...options,
            context: {
              ...options.context,
              args,
            },
          })

          if (options.rethrow) {
            throw error
          }

          return undefined as any
        }) as ReturnType<T>
      }

      return result
    } catch (error) {
      handleError(error, {
        ...options,
        context: {
          ...options.context,
          args,
        },
      })

      if (options.rethrow) {
        throw error
      }

      return undefined as any
    }
  }
}

/**
 * Decorator for error handling
 */
export function handleErrors(options: ErrorHandlerOptions = {}) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: any[]) {
      try {
        const result = originalMethod.apply(this, args)

        // Handle promises
        if (result instanceof Promise) {
          return result.catch((error) => {
            handleError(error, {
              ...options,
              context: {
                ...options.context,
                class: target.constructor.name,
                method: propertyKey,
                args,
              },
            })

            if (options.rethrow) {
              throw error
            }

            return undefined
          })
        }

        return result
      } catch (error) {
        handleError(error, {
          ...options,
          context: {
            ...options.context,
            class: target.constructor.name,
            method: propertyKey,
            args,
          },
        })

        if (options.rethrow) {
          throw error
        }

        return undefined
      }
    }

    return descriptor
  }
}

// Set up global error handlers
export function setupGlobalErrorHandlers(): void {
  if (typeof window !== "undefined") {
    // Browser environment

    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      handleError(event.reason, {
        context: {
          type: "unhandledrejection",
          message: event.reason?.message || "Unhandled Promise Rejection",
        },
        severity: "high",
      })
    })

    // Handle uncaught errors
    window.addEventListener("error", (event) => {
      handleError(event.error || new Error(event.message), {
        context: {
          type: "uncaughterror",
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        severity: "high",
      })
    })
  } else {
    // Node.js environment

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      handleError(reason || new Error("Unhandled Promise Rejection"), {
        context: {
          type: "unhandledrejection",
        },
        severity: "high",
      })
    })

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      handleError(error, {
        context: {
          type: "uncaughtexception",
        },
        severity: "critical",
      })

      // Give logger time to flush, then exit
      setTimeout(() => {
        process.exit(1)
      }, 1000)
    })
  }

  logger.info("Global error handlers set up")
}
