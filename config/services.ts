// Services configuration and defaults

export const serviceConfig = {
  apiGateway: {
    port: 8100,
    healthEndpoint: '/healthz',
    maxRetries: 3,
    criticalService: true,
    retryInterval: 5000, // 5 seconds
  },
  auth: {
    port: 8105,
    healthEndpoint: '/healthz',
    maxRetries: 3,
    criticalService: true,
    sessionTimeout: 3600, // 1 hour
    refreshThreshold: 300, // 5 minutes before expiry
  },
  ai: {
    nlpEngine: {
      port: 8110,
      healthEndpoint: '/healthz',
      maxRetries: 2,
      criticalService: false,
      modelConfig: {
        maxTokens: 2048,
        temperature: 0.7,
      }
    },
    semanticExtractor: {
      port: 8111,
      healthEndpoint: '/healthz',
      maxRetries: 2,
      criticalService: false,
      cacheTimeout: 3600, // 1 hour
    },
    aiMiner: {
      port: 8112,
      healthEndpoint: '/healthz',
      maxRetries: 2,
      criticalService: false,
      batchSize: 100,
    }
  },
  orchestrator: {
    port: 8500,
    healthEndpoint: '/healthz',
    maxRetries: 3,
    criticalService: true,
    syncInterval: 60000, // 1 minute
  },
  monitoring: {
    port: 8120,
    healthEndpoint: '/healthz',
    maxRetries: 3,
    criticalService: true,
    metricsInterval: 15000, // 15 seconds
    retentionPeriod: 604800, // 7 days
  }
}

export const environments = {
  development: {
    domain: 'localhost',
    ssl: false,
    debug: true,
    metricsEnabled: true,
  },
  staging: {
    domain: 'staging.globalarkacademy.org',
    ssl: true,
    debug: true,
    metricsEnabled: true,
  },
  production: {
    domain: 'globalarkacademy.org',
    ssl: true,
    debug: false,
    metricsEnabled: true,
  }
} as const

export const defaultHeaders = {
  'Content-Type': 'application/json',
  'X-Client-Version': process.env.NEXT_PUBLIC_VERSION || '1.0.0',
  'X-Client-Name': 'ark7-frontend'
}

export const requestTimeouts = {
  default: 5000, // 5 seconds
  long: 30000, // 30 seconds
  download: 300000, // 5 minutes
}

export const errorMessages = {
  serviceUnavailable: 'Service is currently unavailable. Please try again later.',
  networkError: 'Network error occurred. Please check your connection.',
  unauthorized: 'You are not authorized to perform this action.',
  sessionExpired: 'Your session has expired. Please login again.',
  rateLimited: 'Too many requests. Please try again later.',
  serverError: 'An unexpected error occurred. Our team has been notified.'
}

// WebSocket configuration
export const wsConfig = {
  reconnectAttempts: 3,
  reconnectInterval: 2000, // 2 seconds
  pingInterval: 30000, // 30 seconds
  pongTimeout: 5000, // 5 seconds
}

// Feature flags
export const features = {
  realTimeMetrics: true,
  aiAssistance: true,
  darkMode: true,
  i18n: true,
  analytics: true,
  experimentalFeatures: process.env.NODE_ENV !== 'production'
}