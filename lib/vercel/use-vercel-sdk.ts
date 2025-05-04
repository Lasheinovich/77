import { Vercel } from '@vercel/client';
import { useCallback, useState } from 'react';

type VercelDeploymentStatus = 'READY' | 'BUILDING' | 'ERROR' | 'QUEUED' | 'CANCELED';

interface VercelDeploymentOptions {
  name?: string;
  target?: 'production' | 'preview';
  gitRef?: string;
  environment?: Record<string, string>;
}

/**
 * Custom hook for using the official Vercel SDK in your components
 * 
 * @param token Vercel API token
 * @param teamId Optional Vercel team ID
 * @returns Methods and state for working with Vercel deployments
 */
export function useVercelSDK(token: string, teamId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<VercelDeploymentStatus | null>(null);

  // Initialize Vercel client with authentication
  const vercelClient = new Vercel({
    token,
    teamId
  });

  const resetState = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setDeploymentId(null);
    setDeploymentUrl(null);
    setDeploymentStatus(null);
  }, []);

  /**
   * Create a new deployment
   */
  const createDeployment = useCallback(async (
    projectId: string,
    options: VercelDeploymentOptions
  ) => {
    resetState();
    setIsLoading(true);

    try {
      const deployment = await vercelClient.deployments.create({
        name: options.name,
        target: options.target || 'preview',
        gitSource: options.gitRef ? {
          type: 'github',
          repo: projectId,
          ref: options.gitRef,
        } : undefined,
        env: options.environment,
      });

      setDeploymentId(deployment.id);
      setDeploymentUrl(deployment.url || '');
      setDeploymentStatus(deployment.readyState as VercelDeploymentStatus);
      
      return deployment;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [vercelClient, resetState]);

  /**
   * Get deployment status
   */
  const getDeploymentStatus = useCallback(async (id: string) => {
    setIsLoading(true);

    try {
      const deployment = await vercelClient.deployments.get(id);
      setDeploymentStatus(deployment.readyState as VercelDeploymentStatus);
      return deployment.readyState;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [vercelClient]);

  /**
   * Poll deployment status until it's ready or failed
   */
  const pollDeploymentStatus = useCallback(async (id: string, intervalMs = 3000, maxAttempts = 100) => {
    setIsLoading(true);
    let attempts = 0;

    return new Promise<string>((resolve, reject) => {
      const poll = async () => {
        try {
          const deployment = await vercelClient.deployments.get(id);
          const status = deployment.readyState as VercelDeploymentStatus;
          setDeploymentStatus(status);

          if (status === 'READY') {
            setIsLoading(false);
            resolve('READY');
            return;
          }

          if (status === 'ERROR') {
            setIsLoading(false);
            reject(new Error('Deployment failed'));
            return;
          }

          attempts++;
          if (attempts >= maxAttempts) {
            setIsLoading(false);
            reject(new Error('Polling timeout'));
            return;
          }

          setTimeout(poll, intervalMs);
        } catch (err) {
          setIsLoading(false);
          setError(err as Error);
          reject(err);
        }
      };

      poll();
    });
  }, [vercelClient]);

  /**
   * Cancel a deployment
   */
  const cancelDeployment = useCallback(async (id: string) => {
    setIsLoading(true);

    try {
      await vercelClient.deployments.cancel(id);
      setDeploymentStatus('CANCELED');
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [vercelClient]);

  /**
   * Promote a deployment to production
   */
  const promoteToProduction = useCallback(async (deploymentId: string, projectId: string) => {
    setIsLoading(true);

    try {
      const result = await vercelClient.deployments.promote({
        id: deploymentId,
        projectId,
        target: 'production'
      });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [vercelClient]);

  /**
   * Get deployment logs
   */
  const getDeploymentLogs = useCallback(async (id: string) => {
    setIsLoading(true);

    try {
      const logs = await vercelClient.deployments.getLogs(id);
      return logs;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [vercelClient]);

  /**
   * List project domains
   */
  const listDomains = useCallback(async (projectId: string) => {
    setIsLoading(true);
    
    try {
      const domains = await vercelClient.domains.list({ projectId });
      return domains;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [vercelClient]);

  /**
   * Add domain to project
   */
  const addDomain = useCallback(async (projectId: string, domain: string) => {
    setIsLoading(true);
    
    try {
      const result = await vercelClient.domains.add({
        projectId,
        name: domain
      });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [vercelClient]);

  /**
   * List environment variables for a project
   */
  const listEnvironmentVariables = useCallback(async (projectId: string) => {
    setIsLoading(true);
    
    try {
      const envVars = await vercelClient.env.list({ projectId });
      return envVars;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [vercelClient]);

  /**
   * Create or update environment variable
   */
  const setEnvironmentVariable = useCallback(async (
    projectId: string,
    key: string,
    value: string,
    targets: string[] = ['production', 'preview', 'development']
  ) => {
    setIsLoading(true);
    
    try {
      const result = await vercelClient.env.create({
        projectId,
        key,
        value,
        target: targets,
        type: 'plain'
      });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [vercelClient]);

  return {
    isLoading,
    error,
    deploymentId,
    deploymentUrl,
    deploymentStatus,
    createDeployment,
    getDeploymentStatus,
    pollDeploymentStatus,
    cancelDeployment,
    promoteToProduction,
    getDeploymentLogs,
    listDomains,
    addDomain,
    listEnvironmentVariables,
    setEnvironmentVariable,
    resetState
  };
}

export default useVercelSDK;