export interface WebVitalsMetric {
  id: string
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB'
  value: number
  delta: number
  entries: PerformanceEntry[]
  navigationType: string
}

export interface PerformanceMetrics {
  FCP?: number // First Contentful Paint
  LCP?: number // Largest Contentful Paint
  FID?: number // First Input Delay
  CLS?: number // Cumulative Layout Shift
  TTFB?: number // Time to First Byte
  INP?: number // Interaction to Next Paint
}

export interface LogEntry {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical'
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

export interface ErrorReport {
  error: Error
  componentStack?: string
  context?: Record<string, any>
  timestamp: string
  userAgent?: string
  location?: string
}

export interface PerformanceTimingMetric {
  name: string
  startTime: number
  duration: number
  metadata?: Record<string, any>
}

export interface MonitoringConfig {
  enabled: boolean
  sampleRate: number
  sentryDSN?: string
  analyticsId?: string
  debug?: boolean
  environment: string
  userAgent?: string
  version?: string
}