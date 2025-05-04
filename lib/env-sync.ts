import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import yaml from 'js-yaml'

interface ServiceConfig {
  port: number
  url: string
}

interface EnvConfig {
  [key: string]: string
}

export class EnvSynchronizer {
  private readonly composeFile: string
  private readonly envFile: string
  private readonly baseDomain: string

  constructor() {
    this.composeFile = path.resolve(process.cwd(), '../docker-compose.yml')
    this.envFile = path.resolve(process.cwd(), '.env.local')
    this.baseDomain = 'globalarkacademy.org'
  }

  private readDockerCompose(): Record<string, ServiceConfig> {
    try {
      const composeContent = fs.readFileSync(this.composeFile, 'utf8')
      const compose = yaml.load(composeContent) as any
      const services: Record<string, ServiceConfig> = {}

      Object.entries(compose.services).forEach(([name, service]: [string, any]) => {
        if (name !== 'cloudflared' && service.environment) {
          const port = parseInt(service.environment.PORT || '8000')
          services[name] = {
            port,
            url: `https://${name}.${this.baseDomain}`
          }
        }
      })

      return services
    } catch (error) {
      console.error('Failed to read docker-compose.yml:', error)
      return {}
    }
  }

  private generateEnvContent(services: Record<string, ServiceConfig>): string {
    const env: EnvConfig = {
      NEXT_PUBLIC_API_URL: `https://api-gateway.${this.baseDomain}`,
      NEXT_PUBLIC_AUTH_URL: `https://auth-service.${this.baseDomain}`,
      NEXT_PUBLIC_APP_NAME: 'الفُلْك | The Ark',
      NODE_ENV: process.env.NODE_ENV || 'development'
    }

    // Add service-specific variables
    Object.entries(services).forEach(([name, config]) => {
      const key = `NEXT_PUBLIC_${name.toUpperCase().replace(/-/g, '_')}_URL`
      env[key] = config.url
    })

    return Object.entries(env)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
  }

  public async sync(): Promise<void> {
    try {
      const services = this.readDockerCompose()
      const envContent = this.generateEnvContent(services)

      fs.writeFileSync(this.envFile, envContent)
      console.log('✅ Successfully synchronized environment variables')
      console.log(`📝 Written to ${this.envFile}`)
      
      Object.entries(services).forEach(([name, config]) => {
        console.log(`  - ${name}: ${config.url}`)
      })
    } catch (error) {
      console.error('❌ Failed to synchronize environment:', error)
      throw error
    }
  }
}

// Create a synchronizer instance
export const envSynchronizer = new EnvSynchronizer()

// Allow running from command line
if (require.main === module) {
  envSynchronizer.sync().catch(console.error)