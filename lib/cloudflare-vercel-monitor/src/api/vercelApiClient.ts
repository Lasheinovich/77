import axios from 'axios';
import { format } from 'date-fns';
import * as vscode from 'vscode';
import { ApiClient, BuildLogEntry, DeploymentInfo } from './types';

export class VercelApiClient implements ApiClient {
  private get apiToken(): string {
    const config = vscode.workspace.getConfiguration('cloudflare-vercel-monitor');
    return config.get<string>('vercelToken') || '';
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json'
    };
  }

  async getDeployments(): Promise<DeploymentInfo[]> {
    if (!this.apiToken) {
      return [];
    }

    try {
      // First, get all projects
      const projectsResponse = await axios.get(
        'https://api.vercel.com/v9/projects',
        { headers: this.getHeaders() }
      );

      if (!projectsResponse.data || !projectsResponse.data.projects) {
        throw new Error('Failed to fetch Vercel projects');
      }

      const projects = projectsResponse.data.projects;
      const deployments: DeploymentInfo[] = [];

      // Then get deployments - we can get all deployments in one call
      const deploymentsResponse = await axios.get(
        'https://api.vercel.com/v6/deployments?limit=20',
        { headers: this.getHeaders() }
      );

      if (!deploymentsResponse.data || !deploymentsResponse.data.deployments) {
        throw new Error('Failed to fetch Vercel deployments');
      }

      // Map deployments to our common DeploymentInfo format
      deployments.push(...deploymentsResponse.data.deployments.map((deployment: any) => {
        // Find project name by ID
        const project = projects.find((p: any) => p.id === deployment.projectId);
        const projectName = project ? project.name : 'Unknown Project';

        return {
          id: deployment.uid,
          name: projectName,
          url: deployment.url ? `https://${deployment.url}` : '',
          status: deployment.state,
          createdAt: deployment.created,
          environment: deployment.target || 'production',
          branch: deployment.meta?.branch || '',
          commitMessage: deployment.meta?.githubCommitMessage || '',
          commitHash: deployment.meta?.githubCommitSha || ''
        };
      }));

      // Sort by creation date (newest first)
      return deployments.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error fetching Vercel deployments:', error);
      throw new Error('Failed to fetch Vercel deployments');
    }
  }

  async getDeploymentDetails(deploymentId: string): Promise<DeploymentInfo> {
    if (!this.apiToken) {
      throw new Error('API token not configured');
    }

    try {
      const deploymentResponse = await axios.get(
        `https://api.vercel.com/v13/deployments/${deploymentId}`,
        { headers: this.getHeaders() }
      );

      if (!deploymentResponse.data) {
        throw new Error(`Deployment ${deploymentId} not found`);
      }

      const deployment = deploymentResponse.data;

      // Get project name
      let projectName = 'Unknown Project';
      try {
        const projectResponse = await axios.get(
          `https://api.vercel.com/v9/projects/${deployment.projectId}`,
          { headers: this.getHeaders() }
        );

        if (projectResponse.data && projectResponse.data.name) {
          projectName = projectResponse.data.name;
        }
      } catch (error) {
        console.error('Error fetching project details:', error);
      }

      return {
        id: deployment.uid,
        name: projectName,
        url: deployment.url ? `https://${deployment.url}` : '',
        status: deployment.state,
        createdAt: deployment.created,
        environment: deployment.target || 'production',
        branch: deployment.meta?.branch || '',
        commitMessage: deployment.meta?.githubCommitMessage || '',
        commitHash: deployment.meta?.githubCommitSha || ''
      };
    } catch (error) {
      console.error(`Error fetching Vercel deployment details for ${deploymentId}:`, error);
      throw new Error('Failed to fetch deployment details');
    }
  }

  async getBuildLogs(deploymentId: string): Promise<BuildLogEntry[]> {
    if (!this.apiToken) {
      return [];
    }

    try {
      const logsResponse = await axios.get(
        `https://api.vercel.com/v2/deployments/${deploymentId}/events`,
        { headers: this.getHeaders() }
      );

      if (!logsResponse.data || !logsResponse.data.events) {
        return [];
      }

      // Transform logs to our format
      return logsResponse.data.events.map((logEvent: any) => ({
        timestamp: format(new Date(logEvent.date), 'yyyy-MM-dd HH:mm:ss'),
        message: logEvent.text || logEvent.payload?.text || JSON.stringify(logEvent.payload),
        level: this.determineLogLevel(logEvent)
      }));
    } catch (error) {
      console.error(`Error fetching build logs for deployment ${deploymentId}:`, error);
      return [{
        timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        message: `Error fetching logs: ${error instanceof Error ? error.message : String(error)}`,
        level: 'error'
      }];
    }
  }

  private determineLogLevel(logEvent: any): 'info' | 'warning' | 'error' {
    // Check event type
    if (logEvent.type === 'error') {
      return 'error';
    }

    // Check message content
    if (logEvent.text) {
      const lowerText = logEvent.text.toLowerCase();
      if (lowerText.includes('error') || lowerText.includes('fail') || lowerText.includes('exception')) {
        return 'error';
      } else if (lowerText.includes('warn')) {
        return 'warning';
      }
    }

    return 'info';
  }
}