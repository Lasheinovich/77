import { logger } from "@/lib/logger"

export interface DeploymentConfig {
  environment: "development" | "staging" | "production"
  version: string
  buildId: string
  features: Record<string, boolean>
  limits: {
    maxUploadSize: number
    maxRequestsPerMinute: number
    maxConcurrentUsers: number
    maxItemsPerPage: number
  }
  maintenance?: {
    enabled: boolean
    message: string
    allowedIps?: string[]
  }
  analytics: {
    enabled: boolean
    provider: string
    trackingId?: string
  }
  security: {
    corsOrigins: string[]
    contentSecurityPolicy: string
    rateLimit: {
      enabled: boolean
      maxRequests: number
      windowMs: number
    }
  }
}

class DeploymentManager {
  private static instance: DeploymentManager
  private config: DeploymentConfig
  private featureOverrides: Map<string, boolean> = new Map()

  private constructor() {
    // Default configuration
    this.config = {
      environment: (process.env.NODE_ENV as any) || "development",
      version: process.env.APP_VERSION || "0.1.0",
      buildId: process.env.BUILD_ID || "development",
      features: {
        aiAssistant: true,
        codePlayground: true,
        marketplace: true,
        adminPanel: true,
        analytics: process.env.NODE_ENV === "production",
        experimentalFeatures: process.env.NODE_ENV !== "production",
      },
      limits: {
        maxUploadSize: 10 * 1024 * 1024, // 10MB
        maxRequestsPerMinute: process.env.NODE_ENV === "production" ? 100 : 1000,
        maxConcurrentUsers: process.env.NODE_ENV === "production" ? 1000 : 100,
        maxItemsPerPage: 100,
      },
      analytics: {
        enabled: process.env.NODE_ENV === "production",
        provider: "vercel",
      },
      security: {
        corsOrigins: ["https://globalarkacademy.org", "https://*.vercel.app"],
        contentSecurityPolicy:
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*.vercel-insights.com https://*.supabase.co",
        rateLimit: {
          enabled: true,
          maxRequests: 100,
          windowMs: 60 * 1000, // 1 minute
        },
      },
    }

    // Load configuration from environment
    this.loadConfigFromEnvironment()
  }

  public static getInstance(): DeploymentManager {
    if (!DeploymentManager.instance) {
      DeploymentManager.instance = new DeploymentManager()
    }
    return DeploymentManager.instance
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfigFromEnvironment(): void {
    try {
      // Override features from environment variables
      for (const [key, value] of Object.entries(this.config.features)) {
        const envKey = `FEATURE_${key.toUpperCase()}`
        if (process.env[envKey] !== undefined) {
          this.config.features[key] = process.env[envKey] === "true"
        }
      }

      // Override limits from environment variables
      for (const [key, value] of Object.entries(this.config.limits)) {
        const envKey = `LIMIT_${key.toUpperCase()}`
        if (process.env[envKey] !== undefined) {
          ;(this.config.limits as any)[key] = Number.parseInt(process.env[envKey] || "0", 10)
        }
      }

      // Check for maintenance mode
      if (process.env.MAINTENANCE_MODE === "true") {
        this.config.maintenance = {
          enabled: true,
          message:
            process.env.MAINTENANCE_MESSAGE ||
            "The system is currently undergoing maintenance. Please try again later.",
          allowedIps: process.env.MAINTENANCE_ALLOWED_IPS?.split(","),
        }
      }

      logger.info("Deployment configuration loaded", {
        environment: this.config.environment,
        version: this.config.version,
        buildId: this.config.buildId,
      })
    } catch (error) {
      logger.error("Error loading deployment configuration", { error })
    }
  }

  /**
   * Get the current deployment configuration
   */
  getConfig(): DeploymentConfig {
    return { ...this.config }
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(featureName: string): boolean {
    // Check for override
    if (this.featureOverrides.has(featureName)) {
      return this.featureOverrides.get(featureName)!
    }

    // Check in config
    return this.config.features[featureName] || false
  }

  /**
   * Override a feature flag (for testing or gradual rollout)
   */
  overrideFeature(featureName: string, enabled: boolean): void {
    this.featureOverrides.set(featureName, enabled)
    logger.info(`Feature override: ${featureName} = ${enabled}`)
  }

  /**
   * Reset feature overrides
   */
  resetFeatureOverrides(): void {
    this.featureOverrides.clear()
  }

  /**
   * Check if the system is in maintenance mode
   */
  isInMaintenanceMode(): boolean {
    return !!this.config.maintenance?.enabled
  }

  /**
   * Check if an IP is allowed during maintenance
   */
  isIpAllowedDuringMaintenance(ip: string): boolean {
    if (!this.config.maintenance?.enabled) {
      return true
    }

    if (!this.config.maintenance.allowedIps || this.config.maintenance.allowedIps.length === 0) {
      return false
    }

    return this.config.maintenance.allowedIps.includes(ip)
  }

  /**
   * Get the maintenance message
   */
  getMaintenanceMessage(): string {
    return this.config.maintenance?.message || "System is under maintenance"
  }

  /**
   * Get a limit value
   */
  getLimit(limitName: keyof DeploymentConfig["limits"]): number {
    return this.config.limits[limitName]
  }
}

// Export singleton instance
export const deploymentManager = DeploymentManager.getInstance()
