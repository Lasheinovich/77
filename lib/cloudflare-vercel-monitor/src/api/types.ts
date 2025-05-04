export interface DeploymentInfo {
  id: string;
  name: string;
  url: string;
  status: string;
  createdAt: string;
  environment: string;
  branch?: string;
  commitMessage?: string;
  commitHash?: string;
}

export interface BuildLogEntry {
  timestamp: string;
  message: string;
  level: 'info' | 'warning' | 'error';
}

export interface ApiClient {
  getDeployments(): Promise<DeploymentInfo[]>;
  getDeploymentDetails(deploymentId: string): Promise<DeploymentInfo>;
  getBuildLogs(deploymentId: string): Promise<BuildLogEntry[]>;
}