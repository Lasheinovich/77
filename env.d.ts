declare namespace NodeJS {
  interface ProcessEnv {
    // API Gateway
    NEXT_PUBLIC_API_GATEWAY_URL: string
    
    // Auth Service
    NEXT_PUBLIC_AUTH_SERVICE_URL: string
    NEXT_PUBLIC_AUTH_COOKIE_NAME: string
    
    // AI Services
    NEXT_PUBLIC_NLP_ENGINE_URL: string
    NEXT_PUBLIC_SEMANTIC_EXTRACTOR_URL: string
    NEXT_PUBLIC_AI_MINER_URL: string
    
    // Orchestrator
    NEXT_PUBLIC_ORCHESTRATOR_URL: string
    
    // Monitoring
    NEXT_PUBLIC_MONITORING_URL: string
    
    // Application
    NEXT_PUBLIC_VERSION: string
    NEXT_PUBLIC_BUILD_ID: string
    NEXT_PUBLIC_DEBUG: string
    NEXT_PUBLIC_AI_NAME: string
    
    // Environment
    NODE_ENV: 'development' | 'staging' | 'production'
    
    // Analytics
    NEXT_PUBLIC_ANALYTICS_ID: string
    
    // Admin
    ADMIN_API_KEY: string
  }
}