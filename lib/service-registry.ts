import { type ApiGatewayService, type AuthService, type AiServices, type DynamicOrchestratorService, type MonitoringService } from '@/types/services'

class ServiceRegistry {
  private apiGateway: ApiGatewayService = {
    baseUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8100',
    endpoints: {
      auth: '/auth',
      ai: '/ai',
      search: '/search',
      analytics: '/analytics'
    }
  }

  private authService: AuthService = {
    baseUrl: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:8105',
    endpoints: {
      login: '/auth/login',
      logout: '/auth/logout',
      register: '/auth/register',
      verify: '/auth/verify',
      resetPassword: '/auth/reset-password',
      refreshToken: '/auth/refresh'
    },
    methods: {
      validateToken: async (token: string) => {
        const response = await fetch(`${this.authService.baseUrl}/auth/validate`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        return response.status === 200
      },
      refreshSession: async () => {
        const response = await fetch(`${this.authService.baseUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include'
        })
        if (!response.ok) throw new Error('Failed to refresh session')
      }
    }
  }

  private aiServices: AiServices = {
    nlpEngine: {
      baseUrl: process.env.NEXT_PUBLIC_NLP_ENGINE_URL || 'http://localhost:8110',
      endpoints: {
        analyze: '/analyze',
        generate: '/generate',
        translate: '/translate'
      }
    },
    semanticExtractor: {
      baseUrl: process.env.NEXT_PUBLIC_SEMANTIC_EXTRACTOR_URL || 'http://localhost:8111',
      endpoints: {
        extract: '/extract',
        summarize: '/summarize',
        classify: '/classify'
      }
    },
    aiMiner: {
      baseUrl: process.env.NEXT_PUBLIC_AI_MINER_URL || 'http://localhost:8112',
      endpoints: {
        mine: '/mine',
        process: '/process',
        analyze: '/analyze'
      }
    }
  }

  private orchestrator: DynamicOrchestratorService = {
    baseUrl: process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:8500',
    endpoints: {
      register: '/register',
      services: '/services',
      metrics: '/metrics',
      health: '/health',
      logs: '/logs'
    },
    methods: {
      registerService: async (config) => {
        const response = await fetch(`${this.orchestrator.baseUrl}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        })
        if (!response.ok) throw new Error('Service registration failed')
      },
      getServiceStatus: async (name) => {
        const response = await fetch(`${this.orchestrator.baseUrl}/service/${name}/status`)
        if (!response.ok) throw new Error('Failed to get service status')
        return response.json()
      },
      restartService: async (name) => {
        const response = await fetch(`${this.orchestrator.baseUrl}/service/${name}/restart`, {
          method: 'POST'
        })
        if (!response.ok) throw new Error('Failed to restart service')
      },
      getMetrics: async (name) => {
        const response = await fetch(`${this.orchestrator.baseUrl}/service/${name}/metrics`)
        if (!response.ok) throw new Error('Failed to get service metrics')
        return response.json()
      }
    }
  }

  private monitoring: MonitoringService = {
    baseUrl: process.env.NEXT_PUBLIC_MONITORING_URL || 'http://localhost:8120',
    endpoints: {
      metrics: '/metrics',
      alerts: '/alerts',
      dashboard: '/dashboard'
    },
    methods: {
      getSystemMetrics: async () => {
        const response = await fetch(`${this.monitoring.baseUrl}/metrics`)
        if (!response.ok) throw new Error('Failed to get system metrics')
        return response.json()
      },
      setAlertThreshold: async (metric, value) => {
        const response = await fetch(`${this.monitoring.baseUrl}/alerts/threshold`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metric, value })
        })
        if (!response.ok) throw new Error('Failed to set alert threshold')
      },
      subscribeToDashboard: (callback) => {
        const ws = new WebSocket(`ws://${this.monitoring.baseUrl}/dashboard/ws`)
        ws.onmessage = (event) => callback(JSON.parse(event.data))
        return () => ws.close()
      }
    }
  }

  // Getters for services
  getApiGateway(): ApiGatewayService {
    return this.apiGateway
  }

  getAuthService(): AuthService {
    return this.authService
  }

  getAiServices(): AiServices {
    return this.aiServices
  }

  getOrchestrator(): DynamicOrchestratorService {
    return this.orchestrator
  }

  getMonitoring(): MonitoringService {
    return this.monitoring
  }

  // Helper to update service URLs based on environment
  updateServiceUrls(env: 'development' | 'staging' | 'production') {
    const domain = env === 'production' 
      ? 'globalarkacademy.org'
      : env === 'staging' 
        ? 'staging.globalarkacademy.org'
        : 'localhost'

    this.apiGateway.baseUrl = `https://api.${domain}`
    this.authService.baseUrl = `https://auth.${domain}`
    this.aiServices.nlpEngine.baseUrl = `https://nlp.${domain}`
    this.aiServices.semanticExtractor.baseUrl = `https://semantic.${domain}`
    this.aiServices.aiMiner.baseUrl = `https://ai-miner.${domain}`
    this.orchestrator.baseUrl = `https://orchestrator.${domain}`
    this.monitoring.baseUrl = `https://monitoring.${domain}`
  }
}

// Export singleton instance
export const serviceRegistry = new ServiceRegistry()