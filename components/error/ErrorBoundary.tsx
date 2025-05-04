import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null
        }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo)
        this.setState({
            error,
            errorInfo
        })
    }

    private handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        })
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <Alert variant="destructive" className="max-w-xl mx-auto my-8">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Something went wrong</AlertTitle>
                    <AlertDescription className="mt-2">
                        <p className="text-sm mb-4">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                            <pre className="text-xs bg-secondary p-2 rounded mt-2 overflow-auto max-h-32">
                                {this.state.errorInfo.componentStack}
                            </pre>
                        )}
                        <Button 
                            variant="outline"
                            onClick={this.handleRetry}
                            className="mt-4"
                        >
                            Try Again
                        </Button>
                    </AlertDescription>
                </Alert>
            )
        }

        return this.props.children
    }
}