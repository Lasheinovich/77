import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { PrismaInstrumentation } from '@prisma/instrumentation'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'ark7-frontend',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  }),
  instrumentations: [
    getNodeAutoInstrumentations(),
    new PrismaInstrumentation(),
  ],
})

// Initialize OpenTelemetry
export function initTelemetry() {
  if (process.env.NODE_ENV === 'production') {
    sdk.start()
      .then(() => {
        console.log('OpenTelemetry initialized')
      })
      .catch((error) => {
        console.error('Error initializing OpenTelemetry:', error)
      })

    // Graceful shutdown
    process.on('SIGTERM', () => {
      sdk.shutdown()
        .then(() => {
          console.log('OpenTelemetry SDK shut down successfully')
          process.exit(0)
        })
        .catch((error) => {
          console.error('Error shutting down OpenTelemetry SDK:', error)
          process.exit(1)
        })
    })
  }
}