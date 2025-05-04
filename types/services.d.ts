// Type definitions for Ark7 Frontend Services

// Health Check Types
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export interface HealthCheckResponse {
  status: HealthStatus
  timestamp: string
  version: string
  buildId: string
  checks: {
    [key: string]: {
      status: HealthStatus
      message?: string
      latency?: number
    }
  }
}

// Service Configuration
export interface ServiceConfig {
  name: string
  version: string
  url: string
  port: number
  criticalService: boolean
  maxRetries: number
  healthEndpoint: string
  dependencies?: string[]
}

// Service Status
export interface ServiceStatus {
  isRunning: boolean
  healthCheckStatus: HealthStatus
  lastHealthCheck: Date
  failedHealthChecks: number
  restartAttempts: number
  lastRestartAttempt?: Date
  lastError?: Error
}

// API Gateway Service
export interface ApiGatewayService {
  baseUrl: string // Default: http://localhost:8100
  endpoints: {
    auth: string
    ai: string
    search: string
    analytics: string
  }
}

// Authentication Service
export interface AuthService {
  baseUrl: string
  endpoints: {
    login: string
    logout: string
    register: string
    verify: string
    resetPassword: string
    refreshToken: string
  }
  methods: {
    validateToken(token: string): Promise<boolean>
    refreshSession(): Promise<void>
  }
}

// AI Services
export interface AiServices {
  nlpEngine: {
    baseUrl: string
    endpoints: {
      analyze: string
      generate: string
      translate: string
    }
  }
  semanticExtractor: {
    baseUrl: string
    endpoints: {
      extract: string
      summarize: string
      classify: string
    }
  }
  aiMiner: {
    baseUrl: string
    endpoints: {
      mine: string
      process: string
      analyze: string
    }
  }
}

// Dynamic Orchestrator Service
export interface DynamicOrchestratorService {
  baseUrl: string
  endpoints: {
    register: string
    services: string
    metrics: string
    health: string
    logs: string
  }
  methods: {
    registerService(config: ServiceConfig): Promise<void>
    getServiceStatus(name: string): Promise<ServiceStatus>
    restartService(name: string): Promise<void>
    getMetrics(name: string): Promise<ServiceMetrics>
  }
}

// Service Metrics
export interface ServiceMetrics {
  memory_usage: number
  cpu_usage: number
  restarts: number
  health: HealthStatus
  latency: number
  requests_per_second: number
  error_rate: number
  dependencies_health: Record<string, HealthStatus>
}

// Monitoring Service
export interface MonitoringService {
  baseUrl: string
  endpoints: {
    metrics: string
    alerts: string
    dashboard: string
  }
  methods: {
    getSystemMetrics(): Promise<SystemMetrics>
    setAlertThreshold(metric: string, value: number): Promise<void>
    subscribeToDashboard(callback: (data: DashboardData) => void): void
  }
}

// System Metrics
export interface SystemMetrics {
  total_memory: number
  used_memory: number
  cpu_load: number
  network_io: {
    incoming: number
    outgoing: number
  }
  disk_usage: {
    total: number
    used: number
  }
  services_health: Record<string, HealthStatus>
}

// Dashboard Data
export interface DashboardData {
  activeUsers: number
  requestsPerMinute: number
  errorRate: number
  serviceHealth: Record<string, HealthStatus>
  alerts: Alert[]
  performance: {
    averageLatency: number
    p95Latency: number
    p99Latency: number
  }
}

// Alert Type
export interface Alert {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: Date
  service?: string
  acknowledged: boolean
}