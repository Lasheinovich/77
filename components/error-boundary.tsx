"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { captureError } from "@/lib/error-tracking"
import { useTranslation } from "@/hooks/use-translation"
import * as Sentry from '@sentry/nextjs'
import { performanceMonitor } from '@/lib/performance/performance-monitor'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onReset?: () => void
  componentName?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error to our error tracking system
    captureError(error, errorInfo, {
      component: this.props.componentName || "Unknown",
      severity: "high",
    })

    // Log error to performance monitor
    performanceMonitor.endMetric('error', {
      error: error.message,
      componentStack: errorInfo.componentStack,
    })

    // Report to Sentry
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    })

    this.setState({
      errorInfo,
    })
  }

  resetErrorBoundary = (): void => {
    if (this.props.onReset) {
      this.props.onReset()
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <DefaultErrorFallback error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  error: Error | null
  resetErrorBoundary: () => void
}

function DefaultErrorFallback({ error, resetErrorBoundary }: DefaultErrorFallbackProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Card className="w-full max-w-md mx-auto my-8 border-destructive/50">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle>{t("error_occurred")}</CardTitle>
        </div>
        <CardDescription>{t("component_error_message")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted p-3 rounded-md text-sm overflow-auto max-h-[200px]">
          <p className="font-mono">{error?.message || t("unknown_error")}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={resetErrorBoundary} className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("try_again")}
        </Button>
      </CardFooter>
    </Card>
  )
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">,
): React.FC<P> {
  const displayName = Component.displayName || Component.name || "Component"

  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps} componentName={displayName}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${displayName})`
  return WrappedComponent
}
