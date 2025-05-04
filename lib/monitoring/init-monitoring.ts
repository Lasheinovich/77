import * as Sentry from '@sentry/nextjs'
import { performanceMonitor } from '@/lib/performance/performance-monitor'
import { logger } from '@/lib/logger'
import type { WebVitalsMetric } from '@/types/monitoring'

class MonitoringService {
  private static instance: MonitoringService
  private initialized: boolean = false

  private constructor() {}

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService()
    }
    return MonitoringService.instance
  }

  public init(): void {
    if (this.initialized) {
      return
    }

    try {
      // Initialize only in production or if explicitly enabled
      if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_MONITORING === 'true') {
        this.initSentry()
        this.initPerformanceMonitoring()
        this.initErrorHandling()
        this.initWebVitals()
      }

      this.initialized = true
      logger.info('Monitoring services initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize monitoring services', error as Error)
      // Don't set initialized to true so we can retry on next init attempt
    }
  }

  private initSentry(): void {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        debug: process.env.NODE_ENV === 'development',
        enabled: process.env.NODE_ENV === 'production',
        environment: process.env.NODE_ENV,
        beforeSend(event) {
          // Sanitize sensitive data
          if (event.request?.cookies) {
            event.request.cookies = '[Redacted]'
          }

          // Filter out specific errors
          if (event.exception?.values?.[0]?.value?.includes('ResizeObserver loop')) {
            return null
          }

          return event
        },
      })

      logger.info('Sentry initialized')
    } else {
      logger.warn('Sentry DSN not found, skipping Sentry initialization')
    }
  }

  private initPerformanceMonitoring(): void {
    // Performance monitoring is self-initializing
    // Just verify it's working
    try {
      performanceMonitor.startMetric('monitoring-check')
      performanceMonitor.endMetric('monitoring-check')
      logger.info('Performance monitoring initialized')
    } catch (error) {
      logger.error('Performance monitoring initialization failed', error as Error)
    }
  }

  private initErrorHandling(): void {
    if (typeof window !== 'undefined') {
      // Global error handler
      window.onerror = (message, source, lineno, colno, error) => {
        logger.error('Global error:', error || new Error(String(message)), {
          source,
          lineno,
          colno,
        })
        return false // Let other error handlers run
      }

      // Unhandled promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        logger.error('Unhandled promise rejection:', event.reason instanceof Error ? event.reason : new Error(String(event.reason)))
        event.preventDefault()
      })

      // Network error handler
      window.addEventListener('offline', () => {
        logger.warn('Network connection lost')
      })

      window.addEventListener('online', () => {
        logger.info('Network connection restored')
      })

      logger.info('Global error handlers initialized')
    }
  }

  private initWebVitals(): void {
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ onCLS, onFID, onLCP, onTTFB, onINP }) => {
        const reportWebVital = (metric: WebVitalsMetric) => {
          // Log the metric
          logger.info(`Web Vital: ${metric.name}`, {
            value: metric.value,
            id: metric.id,
            navigationType: metric.navigationType,
          })

          // Send to analytics if available
          if ((window as any).gtag) {
            ;(window as any).gtag('event', 'web_vitals', {
              metric_name: metric.name,
              value: metric.value,
              metric_id: metric.id,
              metric_delta: metric.delta,
            })
          }
        }

        // Monitor Core Web Vitals
        onCLS(reportWebVital)
        onFID(reportWebVital)
        onLCP(reportWebVital)
        onTTFB(reportWebVital)
        onINP(reportWebVital)

        logger.info('Web Vitals monitoring initialized')
      })
    }
  }

  public captureError(error: Error, context?: Record<string, any>): void {
    logger.error(error.message, error, context)
    Sentry.captureException(error, { extra: context })
  }

  public captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>): void {
    logger.info(message, context)
    Sentry.captureMessage(message, {
      level,
      extra: context,
    })
  }

  public setUser(user: { id: string; email?: string; username?: string }): void {
    Sentry.setUser(user)
    logger.setContext({ user: { id: user.id } })
  }

  public clearUser(): void {
    Sentry.setUser(null)
    logger.clearContext()
  }
}

export const monitoring = MonitoringService.getInstance()