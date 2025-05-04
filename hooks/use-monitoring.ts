import { useEffect, useCallback } from 'react'
import { monitoring } from '@/lib/monitoring/init-monitoring'
import { performanceMonitor } from '@/lib/performance/performance-monitor'
import { logger } from '@/lib/logger'

interface UseMonitoringOptions {
  componentName: string
  enablePerfMetrics?: boolean
  logProps?: boolean
  trackRenders?: boolean
}

export function useMonitoring({
  componentName,
  enablePerfMetrics = false,
  logProps = false,
  trackRenders = false,
}: UseMonitoringOptions) {
  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    monitoring.captureError(error, {
      componentName,
      ...context,
    })
  }, [componentName])

  const trackEvent = useCallback((eventName: string, data?: Record<string, any>) => {
    monitoring.captureMessage(`${componentName}: ${eventName}`, 'info', data)
  }, [componentName])

  const measurePerformance = useCallback(<T>(
    operationName: string,
    operation: () => Promise<T> | T,
    context?: Record<string, any>
  ) => {
    return performanceMonitor.measure(
      `${componentName}.${operationName}`,
      operation,
      context
    )
  }, [componentName])

  useEffect(() => {
    if (trackRenders) {
      logger.debug(`${componentName} rendered`)
    }

    if (enablePerfMetrics) {
      const metricId = performanceMonitor.startMetric(`${componentName}.mounted`)

      return () => {
        performanceMonitor.endMetric(metricId)
        if (trackRenders) {
          logger.debug(`${componentName} unmounted`)
        }
      }
    }
  }, [componentName, enablePerfMetrics, trackRenders])

  return {
    trackError,
    trackEvent,
    measurePerformance,
  }
}

// HOC to automatically wrap components with monitoring
export function withMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<UseMonitoringOptions, 'componentName'>
) {
  const componentName = WrappedComponent.displayName || WrappedComponent.name || 'Component'
  
  function WithMonitoring(props: P) {
    useMonitoring({
      componentName,
      ...options,
    })

    return <WrappedComponent {...props} />
  }

  WithMonitoring.displayName = `withMonitoring(${componentName})`
  return WithMonitoring
}