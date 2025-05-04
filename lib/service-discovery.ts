import fs from 'fs';
import path from 'path';

// List of known backend services (update as services change)
const SERVICE_FOLDERS = [
  'ai-miner',
  'api-gateway',
  'auth-service',
  'book-gen',
  'coach-agent',
  'dashboard-ui',
  'deep-search',
  'divine-dynamic-orchestrator-1',
  'doc-reader',
  'ds-lab',
  'media-generator',
  'ml-trainer',
  'monitoring',
  'nlp-engine',
  'qa-agent',
  'scenario-simulator',
  'semantic-extractor',
  'shared-core',
  'slide-gen',
  'tutor-agent',
  'video-gen',
  'web-grabber',
];

interface ServiceConfig {
  name: string;
  healthCheckInterval: number;
  maxRetries: number;
  retryDelay: number;
  criticalService: boolean;
  restartStrategy: 'immediate' | 'exponential-backoff' | 'manual';
}

function getDefaultConfig(name: string): ServiceConfig {
  return {
    name,
    healthCheckInterval: 180000,
    maxRetries: 3,
    retryDelay: 5000,
    criticalService: false,
    restartStrategy: 'exponential-backoff',
  };
}

/**
 * Scans the workspace for service folders and returns their default configs
 */
export async function fetchServiceList(): Promise<ServiceConfig[]> {
  const root = path.resolve(__dirname, '../../');
  const configs: ServiceConfig[] = [];

  for (const folder of SERVICE_FOLDERS) {
    const servicePath = path.join(root, folder);
    if (fs.existsSync(servicePath) && fs.existsSync(path.join(servicePath, 'Dockerfile'))) {
      configs.push(getDefaultConfig(folder));
    }
  }

  return configs;
}

