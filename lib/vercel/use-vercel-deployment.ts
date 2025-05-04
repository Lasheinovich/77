'use client';

import { useCallback, useState } from 'react';
import VercelApiClient from './vercel-api-client';

/**
 * Custom hook for using Vercel deployment features in your components
 * 
 * @param token Vercel API token
 * @param teamId Optional Vercel team ID
 * @returns Methods and state for working with Vercel deployments
 */
export function useVercelDeployment(token: string, teamId?: string) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [deploymentId, setDeploymentId] = useState<string | null>(null);
    const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
    const [deploymentStatus, setDeploymentStatus] = useState<string | null>(null);

    const client = new VercelApiClient(token, teamId);

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
        options: {
            name?: string;
            target?: 'production' | 'preview';
            gitRef?: string;
            environment?: Record<string, string>;
        }
    ) => {
        resetState();
        setIsLoading(true);

        try {
            const deployment = await client.createDeployment({
                name: options.name,
                target: options.target || 'preview',
                gitSource: options.gitRef ? {
                    type: 'github',
                    repo: projectId,
                    ref: options.gitRef,
                } : undefined,
                environment: options.environment,
            });

            setDeploymentId(deployment.id);
            setDeploymentUrl(deployment.url);
            setDeploymentStatus(deployment.readyState);
            return deployment;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [client, resetState]);

    /**
     * Get deployment status
     */
    const getDeploymentStatus = useCallback(async (id: string) => {
        setIsLoading(true);

        try {
            const deployment = await client.getDeployment(id);
            setDeploymentStatus(deployment.readyState);
            return deployment.readyState;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [client]);

    /**
     * Poll deployment status until it's ready or failed
     */
    const pollDeploymentStatus = useCallback(async (id: string, intervalMs = 3000, maxAttempts = 100) => {
        setIsLoading(true);
        let attempts = 0;

        return new Promise<string>((resolve, reject) => {
            const poll = async () => {
                try {
                    const deployment = await client.getDeployment(id);
                    setDeploymentStatus(deployment.readyState);

                    if (deployment.readyState === 'READY') {
                        setIsLoading(false);
                        resolve('READY');
                        return;
                    }

                    if (deployment.readyState === 'ERROR') {
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
    }, [client]);

    /**
     * Cancel a deployment
     */
    const cancelDeployment = useCallback(async (id: string) => {
        setIsLoading(true);

        try {
            await client.cancelDeployment(id);
            setDeploymentStatus('CANCELED');
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [client]);

    /**
     * Promote a deployment to production
     */
    const promoteToProduction = useCallback(async (deploymentId: string, projectId: string) => {
        setIsLoading(true);

        try {
            const result = await client.promoteToProduction(deploymentId, projectId);
            return result;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [client]);

    /**
     * Get deployment logs
     */
    const getDeploymentLogs = useCallback(async (id: string) => {
        setIsLoading(true);

        try {
            const logs = await client.getDeploymentLogs(id);
            return logs;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [client]);

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
        resetState,
    };
}

export default useVercelDeployment;