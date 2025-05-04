import axios from 'axios';
import { format } from 'date-fns';
import * as vscode from 'vscode';
import { ApiClient, BuildLogEntry, DeploymentInfo } from './types';

export class CloudflareApiClient implements ApiClient {
  private get apiToken(): string {
    const config = vscode.workspace.getConfiguration('cloudflare-vercel-monitor');
    return config.get<string>('cloudflareToken') || '';
  }

  private get accountId(): string {
    const config = vscode.workspace.getConfiguration('cloudflare-vercel-monitor');
    return config.get<string>('cloudflareAccountId') || '';
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json'
    };
  }

  async getDeployments(): Promise<DeploymentInfo[]> {
    if (!this.apiToken || !this.accountId) {
      return [];
    }

    try {
      // First, get all projects
      const projectsResponse = await axios.get(
        `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/pages/projects`,
        { headers: this.getHeaders() }
      );

      if (!projectsResponse.data.success) {
        throw new Error('Failed to fetch Cloudflare Pages projects');
      }

      const projects = projectsResponse.data.result;
      const deployments: DeploymentInfo[] = [];

      // For each project, get the latest deployments
      for (const project of projects) {
        try {
          const deploymentsResponse = await axios.get(
            `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/pages/projects/${project.name}/deployments`,
            { headers: this.getHeaders() }
          );

          if (!deploymentsResponse.data.success) {
            continue;
          }

          // Map to our common DeploymentInfo format
          const projectDeployments = deploymentsResponse.data.result.map((deployment: any) => ({
            id: deployment.id,
            name: project.name,
            url: deployment.url,
            status: deployment.stage_name.toLowerCase(),
            createdAt: deployment.created_on,
            environment: deployment.environment,
            branch: deployment.deployment_trigger?.metadata?.branch,
            commitMessage: deployment.deployment_trigger?.metadata?.commit_message,
            commitHash: deployment.deployment_trigger?.metadata?.commit_hash
          }));

          deployments.push(...projectDeployments);
        } catch (error) {
          console.error(`Error fetching deployments for project ${project.name}:`, error);
        }
      }

      // Sort deployments by creation date (newest first)
      return deployments.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error fetching Cloudflare deployments:', error);
      throw new Error('Failed to fetch Cloudflare deployments');
    }
  }

  async getDeploymentDetails(deploymentId: string): Promise<DeploymentInfo> {
    if (!this.apiToken || !this.accountId) {
      throw new Error('API credentials not configured');
    }

    try {
      // First we need to determine which project this deployment belongs to
      const projectsResponse = await axios.get(
        `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/pages/projects`,
        { headers: this.getHeaders() }
      );

      if (!projectsResponse.data.success) {
        throw new Error('Failed to fetch Cloudflare Pages projects');
      }

      const projects = projectsResponse.data.result;

      // Search for the deployment in each project
      for (const project of projects) {
        try {
          const deploymentResponse = await axios.get(
            `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/pages/projects/${project.name}/deployments/${deploymentId}`,
            { headers: this.getHeaders() }
          );

          if (deploymentResponse.data.success) {
            const deployment = deploymentResponse.data.result;
            return {
              id: deployment.id,
              name: project.name,
              url: deployment.url,
              status: deployment.stage_name.toLowerCase(),
              createdAt: deployment.created_on,
              environment: deployment.environment,
              branch: deployment.deployment_trigger?.metadata?.branch,
              commitMessage: deployment.deployment_trigger?.metadata?.commit_message,
              commitHash: deployment.deployment_trigger?.metadata?.commit_hash
            };
          }
        } catch (error) {
          // Continue trying other projects if not found
          continue;
        }
      }

      throw new Error(`Deployment ${deploymentId} not found`);
    } catch (error) {
      console.error(`Error fetching Cloudflare deployment details for ${deploymentId}:`, error);
      throw new Error('Failed to fetch deployment details');
    }
  }

  async getBuildLogs(deploymentId: string): Promise<BuildLogEntry[]> {
    if (!this.apiToken || !this.accountId) {
      return [];
    }

    try {
      // First we need to determine which project this deployment belongs to
      const projectsResponse = await axios.get(
        `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/pages/projects`,
        { headers: this.getHeaders() }
      );

      if (!projectsResponse.data.success) {
        throw new Error('Failed to fetch Cloudflare Pages projects');
      }

      const projects = projectsResponse.data.result;

      // Search for the deployment in each project
      for (const project of projects) {
        try {
          const logsResponse = await axios.get(
            `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/pages/projects/${project.name}/deployments/${deploymentId}/history/logs`,
            { headers: this.getHeaders() }
          );

          if (logsResponse.data.success) {
            // Transform the logs to our format
            return logsResponse.data.result.map((logEntry: any) => ({
              timestamp: format(new Date(logEntry.timestamp), 'yyyy-MM-dd HH:mm:ss'),
              message: logEntry.message,
              level: this.determineLogLevel(logEntry.message)
            }));
          }
        } catch (error) {
          // Continue trying other projects if not found
          continue;
        }
      }

      return []; // No logs found
    } catch (error) {
      console.error(`Error fetching build logs for deployment ${deploymentId}:`, error);
      return [{
        timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        message: `Error fetching logs: ${error instanceof Error ? error.message : String(error)}`,
        level: 'error'
      }];
    }
  }

  private determineLogLevel(message: string): 'info' | 'warning' | 'error' {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('error') || lowerMessage.includes('fail')) {
      return 'error';
    } else if (lowerMessage.includes('warn')) {
      return 'warning';
    }
    return 'info';
  }
}