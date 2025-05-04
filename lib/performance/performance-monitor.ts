import { logger } from "@/lib/logger"
import * as Sentry from '@sentry/nextjs'

interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

interface PerformanceReport {
  metrics: PerformanceMetric[]
  averages: Record<string, number>
  slowest: Record<string, PerformanceMetric>
  fastest: Record<string, PerformanceMetric>
  counts: Record<string, number>
}

interface MetricData {
  name: string
  value: number
  tags?: Record<string, string | number>
}

interface TimingMetric {
  startTime: number
  name: string
  tags?: Record<string, string | number>
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private activeMetrics: Map<string, PerformanceMetric> = new Map()
  private readonly MAX_METRICS = 1000
  private timings: Map<string, TimingMetric> = new Map()

  private constructor() {
    if (typeof window !== 'undefined') {
      // Monitor route changes
      this.observeRouteChanges()
      // Monitor web vitals
      this.observeWebVitals()
      // Monitor long tasks
      this.observeLongTasks()
      // Monitor memory usage
      this.observeMemoryUsage()
    }
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private observeRouteChanges() {
    if (typeof window === 'undefined') return

    let routeChangeStart = 0
    window.addEventListener('routeChangeStart', () => {
      routeChangeStart = performance.now()
    })

    window.addEventListener('routeChangeComplete', () => {
      const duration = performance.now() - routeChangeStart
      this.recordMetric('route_change_duration', duration)
    })
  }

  private observeWebVitals() {
    if (typeof window === 'undefined') return

    // First Contentful Paint
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        this.recordMetric('fcp', entry.startTime)
      }
    }).observe({ entryTypes: ['paint'] })

    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        this.recordMetric('lcp', entry.startTime)
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const delay = entry.processingStart - entry.startTime
        this.recordMetric('fid', delay)
      }
    }).observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift
    new PerformanceObserver((entryList) => {
      let cumulativeScore = 0
      for (const entry of entryList.getEntries()) {
        cumulativeScore += (entry as any).value
      }
      this.recordMetric('cls', cumulativeScore)
    }).observe({ entryTypes: ['layout-shift'] })
  }

  private observeLongTasks() {
    if (typeof window === 'undefined') return

    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        this.recordMetric('long_task_duration', entry.duration, {
          culprit: entry.name,
        })
      }
    }).observe({ entryTypes: ['longtask'] })
  }

  private observeMemoryUsage() {
    if (typeof window === 'undefined') return

    const recordMemoryMetrics = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        this.recordMetric('heap_size', memory.usedJSHeapSize)
        this.recordMetric('heap_limit', memory.jsHeapSizeLimit)
      }
    }

    // Record every 30 seconds
    setInterval(recordMemoryMetrics, 30000)
    recordMemoryMetrics() // Initial recording
  }

  public startMetric(name: string, metadata?: Record<string, any>, tags?: Record<string, string | number>): string {
    const id = `${name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    }

    this.activeMetrics.set(id, metric)

    const timingMetric: TimingMetric = {
      startTime: performance.now(),
      name,
      tags,
    }
    this.timings.set(name, timingMetric)

    return id
  }

  public endMetric(id: string, additionalMetadata?: Record<string, any>, additionalTags?: Record<string, string | number>): PerformanceMetric | null {
    const metric = this.activeMetrics.get(id)

    if (!metric) {
      logger.warn(`Performance metric with ID ${id} not found`)
      return null
    }

    metric.endTime = performance.now()
    metric.duration = metric.endTime - metric.startTime

    // Merge additional metadata
    if (additionalMetadata) {
      metric.metadata = {
        ...metric.metadata,
        ...additionalMetadata,
      }
    }

    // Remove from active metrics
    this.activeMetrics.delete(id)

    // Add to completed metrics
    this.metrics.push(metric)

    // Trim metrics if needed
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS)
    }

    // Log slow operations
    if (metric.duration > 1000) {
      // More than 1 second
      logger.warn(`Slow operation detected: ${metric.name}`, {
        duration: metric.duration,
        metadata: metric.metadata,
      })
    }

    const timingMetric = this.timings.get(metric.name)
    if (!timingMetric) return metric

    const duration = performance.now() - timingMetric.startTime
    this.timings.delete(metric.name)

    const tags = {
      ...timingMetric.tags,
      ...additionalTags,
    }

    this.recordMetric(metric.name, duration, tags)

    return metric
  }

  private recordMetric(name: string, value: number, tags?: Record<string, string | number>) {
    const metric: MetricData = {
      name,
      value,
      tags,
    }

    // Send to Sentry as a custom measurement
    Sentry.addMeasurement(name, value, tags?.type as string)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Performance] ${name}:`, {
        value: Math.round(value * 100) / 100,
        ...(tags && { tags }),
      })
    }

    // If connected to an analytics service, send the metric
    this.sendToAnalytics(metric)
  }

  private sendToAnalytics(metric: MetricData) {
    // Example integration with Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: metric.name,
        value: metric.value,
        ...metric.tags,
      })
    }
  }

  async measure<T>(name: string, fn: () => Promise<T> | T, metadata?: Record<string, any>, tags?: Record<string, string | number>): Promise<T> {
    const id = this.startMetric(name, metadata, tags)

    try {
      const result = await fn()
      this.endMetric(id)
      return result
    } catch (error) {
      this.endMetric(id, { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  generateReport(): PerformanceReport {
    const metricsByName: Record<string, PerformanceMetric[]> = {}
    const averages: Record<string, number> = {}
    const slowest: Record<string, PerformanceMetric> = {}
    const fastest: Record<string, PerformanceMetric> = {}
    const counts: Record<string, number> = {}

    // Group metrics by name
    for (const metric of this.metrics) {
      if (!metric.duration) continue

      if (!metricsByName[metric.name]) {
        metricsByName[metric.name] = []
      }

      metricsByName[metric.name].push(metric)
    }

    // Calculate statistics
    for (const [name, metrics] of Object.entries(metricsByName)) {
      counts[name] = metrics.length

      // Calculate average
      const total = metrics.reduce((sum, metric) => sum + (metric.duration || 0), 0)
      averages[name] = total / metrics.length

      // Find slowest
      slowest[name] = metrics.reduce(
        (slowest, metric) => {
          return !slowest.duration || (metric.duration || 0) > slowest.duration! ? metric : slowest
        },
        { name, startTime: 0, duration: 0 },
      )

      // Find fastest
      fastest[name] = metrics.reduce(
        (fastest, metric) => {
          return !fastest.duration || (metric.duration || 0) < fastest.duration! ? metric : fastest
        },
        { name, startTime: 0, duration: Number.MAX_VALUE },
      )
    }

    return {
      metrics: this.metrics,
      averages,
      slowest,
      fastest,
      counts,
    }
  }

  clearMetrics(): void {
    this.metrics = []
  }

  getActiveMetrics(): PerformanceMetric[] {
    return Array.from(this.activeMetrics.values())
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()

export function measure(name?: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value
    const metricName = name || `${target.constructor.name}.${propertyKey}`

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measure(metricName, () => originalMethod.apply(this, args), {
        args: args.map((arg) => (typeof arg === "object" ? "[Object]" : arg)),
      })
    }

    return descriptor
  }
}
