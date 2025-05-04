import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
    Activity,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Server,
    CircuitBoard
} from "lucide-react"

interface ServiceHealth {
    status: string
    latency: number
    last_check: string
    details: Record<string, any>
}

interface SystemHealth {
    overall_status: string
    services: Record<string, ServiceHealth>
    timestamp: string
}

interface ServiceMetrics {
    resource_usage: {
        memory_mb: number
        cpu_percent: number
        threads: number
    }
    performance: {
        requests_processed: number
        average_processing_time: number
        error_count: number
    }
}

export default function SystemHealthPanel() {
    const [health, setHealth] = useState<SystemHealth | null>(null)
    const [metrics, setMetrics] = useState<Record<string, ServiceMetrics>>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchHealthData = async () => {
            try {
                const response = await fetch('/api/monitoring/health')
                const data = await response.json()
                setHealth(data)
                setError(null)
            } catch (err) {
                setError('Failed to fetch health data')
                console.error('Health check error:', err)
            }
        }

        const fetchMetrics = async () => {
            try {
                const response = await fetch('/api/monitoring/metrics')
                const data = await response.json()
                setMetrics(data.metrics)
                setError(null)
            } catch (err) {
                setError('Failed to fetch metrics data')
                console.error('Metrics error:', err)
            }
        }

        const loadData = async () => {
            setLoading(true)
            await Promise.all([fetchHealthData(), fetchMetrics()])
            setLoading(false)
        }

        loadData()
        const interval = setInterval(loadData, 30000) // Refresh every 30 seconds
        return () => clearInterval(interval)
    }, [])

    if (loading) return <div>Loading system health data...</div>
    if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
    if (!health) return null

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
                return <CheckCircle className="text-green-500" />
            case 'degraded':
                return <AlertTriangle className="text-yellow-500" />
            case 'unhealthy':
                return <XCircle className="text-red-500" />
            default:
                return <Activity className="text-gray-500" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'bg-green-500'
            case 'degraded':
                return 'bg-yellow-500'
            case 'unhealthy':
                return 'bg-red-500'
            default:
                return 'bg-gray-500'
        }
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>System Health Status</CardTitle>
                        <Badge className={getStatusColor(health.overall_status)}>
                            {health.overall_status.toUpperCase()}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(health.services).map(([service, data]) => (
                            <Card key={service}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium">{service}</h3>
                                        {getStatusIcon(data.status)}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Latency</span>
                                            <span>{data.latency.toFixed(2)}ms</span>
                                        </div>
                                        {metrics[service] && (
                                            <>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span>CPU Usage</span>
                                                        <span>{metrics[service].resource_usage.cpu_percent}%</span>
                                                    </div>
                                                    <Progress 
                                                        value={metrics[service].resource_usage.cpu_percent} 
                                                        className="h-1"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span>Memory</span>
                                                        <span>
                                                            {Math.round(metrics[service].resource_usage.memory_mb)}MB
                                                        </span>
                                                    </div>
                                                    <Progress 
                                                        value={
                                                            (metrics[service].resource_usage.memory_mb / 1024) * 100
                                                        } 
                                                        className="h-1"
                                                    />
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>Error Rate</span>
                                                    <span>
                                                        {(
                                                            metrics[service].performance.error_count /
                                                            Math.max(metrics[service].performance.requests_processed, 1) *
                                                            100
                                                        ).toFixed(2)}%
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}