import axios from 'axios';

type VercelDeploymentOptions = {
    name?: string;
    target?: 'production' | 'preview';
    teamId?: string;
    gitSource?: {
        type: 'github' | 'gitlab' | 'bitbucket';
        repo: string;
        ref?: string;
    };
    environment?: Record<string, string>;
};

type VercelDeploymentResponse = {
    id: string;
    url: string;
    createdAt: string;
    readyState: 'READY' | 'BUILDING' | 'ERROR' | 'QUEUED' | 'CANCELED';
    meta?: Record<string, unknown>;
};

// Define interfaces for Vercel API responses
interface VercelDeploymentLogsResponse {
    logs: Array<{
        id: string;
        text: string;
        type: 'stdout' | 'stderr';
        created: number;
    }>;
    timestamp: number;
    deploymentId: string;
}

interface VercelDomainResponse {
    name: string;
    apexName: string;
    projectId: string;
    redirect?: string | null;
    redirectStatusCode?: number;
    gitBranch?: string | null;
    verified: boolean;
    createdAt: number;
}

interface VercelDomainCheckResponse {
    available: boolean;
    price?: number;
    premium?: boolean;
    suggestions?: string[];
}

interface VercelEnvironmentVariable {
    id: string;
    key: string;
    value: string;
    target: string[];
    createdAt: number;
    updatedAt: number;
    type: 'plain' | 'secret';
    configurationId?: string | null;
    gitBranch?: string | null;
}

interface VercelEnvironmentVariablesResponse {
    envs: VercelEnvironmentVariable[];
}

interface VercelAliasResponse {
    alias: string;
    createdAt: number;
    deploymentId: string;
}

/**
 * Vercel API client for deployment automation.
 * 
 * This utility provides methods to interact with Vercel's REST API
 * for automating deployments, domain management, and monitoring.
 */
export class VercelApiClient {
    private apiUrl = 'https://api.vercel.com/v13';
    private token: string;
    private teamId?: string;

    /**
     * Creates a new Vercel API client instance
     */
    constructor(token: string, teamId?: string) {
        this.token = token;
        this.teamId = teamId;
    }

    /**
     * Get the default headers for API requests
     */
    private getHeaders() {
        return {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
        };
    }

    /**
     * Get the query parameters for team requests
     */
    private getTeamQuery() {
        return this.teamId ? `?teamId=${this.teamId}` : '';
    }

    /**
     * Create a new deployment
     */
    async createDeployment(options: VercelDeploymentOptions): Promise<VercelDeploymentResponse> {
        try {
            const response = await axios.post(
                `${this.apiUrl}/deployments${this.getTeamQuery()}`,
                options,
                { headers: this.getHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Error creating deployment:', error);
            throw error;
        }
    }

    /**
     * Get a deployment by its ID
     */
    async getDeployment(deploymentId: string): Promise<VercelDeploymentResponse> {
        try {
            const response = await axios.get(
                `${this.apiUrl}/deployments/${deploymentId}${this.getTeamQuery()}`,
                { headers: this.getHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error(`Error getting deployment ${deploymentId}:`, error);
            throw error;
        }
    }

    /**
     * List all deployments
     */
    async listDeployments(limit = 20, from?: string): Promise<{ deployments: VercelDeploymentResponse[] }> {
        try {
            let url = `${this.apiUrl}/deployments?limit=${limit}${this.getTeamQuery() ? '&' + this.getTeamQuery().substring(1) : ''}`;
            if (from) url += `&from=${from}`;

            const response = await axios.get(url, { headers: this.getHeaders() });
            return response.data;
        } catch (error) {
            console.error('Error listing deployments:', error);
            throw error;
        }
    }

    /**
     * Cancel a deployment that is currently building
     */
    async cancelDeployment(deploymentId: string): Promise<void> {
        try {
            await axios.patch(
                `${this.apiUrl}/deployments/${deploymentId}/cancel${this.getTeamQuery()}`,
                {},
                { headers: this.getHeaders() }
            );
        } catch (error) {
            console.error(`Error canceling deployment ${deploymentId}:`, error);
            throw error;
        }
    }

    /**
     * Get build logs for a deployment
     */
    async getDeploymentLogs(deploymentId: string): Promise<VercelDeploymentLogsResponse> {
        try {
            const response = await axios.get(
                `${this.apiUrl}/deployments/${deploymentId}/events${this.getTeamQuery()}`,
                { headers: this.getHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error(`Error getting logs for deployment ${deploymentId}:`, error);
            throw error;
        }
    }

    /**
     * Add a domain to the project
     */
    async addDomain(domain: string, projectId: string): Promise<VercelDomainResponse> {
        try {
            const response = await axios.post(
                `${this.apiUrl}/projects/${projectId}/domains${this.getTeamQuery()}`,
                { name: domain },
                { headers: this.getHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error(`Error adding domain ${domain}:`, error);
            throw error;
        }
    }

    /**
     * Check domain availability and price
     */
    async checkDomain(domain: string): Promise<VercelDomainCheckResponse> {
        try {
            const response = await axios.get(
                `${this.apiUrl}/domains/check?domain=${domain}${this.getTeamQuery() ? '&' + this.getTeamQuery().substring(1) : ''}`,
                { headers: this.getHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error(`Error checking domain ${domain}:`, error);
            throw error;
        }
    }

    /**
     * Get environment variables for a project
     */
    async getEnvironmentVariables(projectId: string): Promise<VercelEnvironmentVariablesResponse> {
        try {
            const response = await axios.get(
                `${this.apiUrl}/projects/${projectId}/env${this.getTeamQuery()}`,
                { headers: this.getHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error(`Error getting environment variables for project ${projectId}:`, error);
            throw error;
        }
    }

    /**
     * Create or update an environment variable for a project
     */
    async setEnvironmentVariable(
        projectId: string,
        key: string,
        value: string,
        target: string[] = ['production', 'preview']
    ): Promise<VercelEnvironmentVariable> {
        try {
            const response = await axios.post(
                `${this.apiUrl}/projects/${projectId}/env${this.getTeamQuery()}`,
                { key, value, target },
                { headers: this.getHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error(`Error setting environment variable ${key} for project ${projectId}:`, error);
            throw error;
        }
    }

    /**
     * Promote a deployment to production
     */
    async promoteToProduction(deploymentId: string, projectId: string): Promise<VercelAliasResponse> {
        try {
            const response = await axios.post(
                `${this.apiUrl}/projects/${projectId}/alias${this.getTeamQuery()}`,
                { deploymentId },
                { headers: this.getHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error(`Error promoting deployment ${deploymentId} to production:`, error);
            throw error;
        }
    }
}

export default VercelApiClient;