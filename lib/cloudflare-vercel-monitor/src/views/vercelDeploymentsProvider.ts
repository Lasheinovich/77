import * as vscode from 'vscode';
import { DeploymentInfo } from '../api/types';
import { VercelApiClient } from '../api/vercelApiClient';
import { DeploymentTreeItem } from './cloudflareDeploymentsProvider';

export class VercelDeploymentsProvider implements vscode.TreeDataProvider<DeploymentTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<DeploymentTreeItem | undefined | null | void> = new vscode.EventEmitter<DeploymentTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<DeploymentTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private deployments: DeploymentInfo[] = [];

  constructor(private vercelApiClient: VercelApiClient) { }

  refresh(): Promise<void> {
    return this.vercelApiClient.getDeployments()
      .then(deployments => {
        this.deployments = deployments;
        this._onDidChangeTreeData.fire();
      });
  }

  getTreeItem(element: DeploymentTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: DeploymentTreeItem): Thenable<DeploymentTreeItem[]> {
    if (element) {
      // If we're getting children of a deployment, there are none
      return Promise.resolve([]);
    } else {
      // Root level - list all deployments
      return Promise.resolve(this.deployments.map(deployment => {
        const item = new DeploymentTreeItem(
          deployment,
          deployment.name,
          vscode.TreeItemCollapsibleState.None
        );

        // Set icon based on deployment status
        if (deployment.status === 'ready' || deployment.status === 'READY') {
          item.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('terminal.ansiGreen'));
        } else if (deployment.status === 'error' || deployment.status === 'ERROR' || deployment.status === 'canceled' || deployment.status === 'CANCELED') {
          item.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('terminal.ansiRed'));
        } else if (deployment.status === 'building' || deployment.status === 'BUILDING' || deployment.status === 'queued' || deployment.status === 'QUEUED') {
          item.iconPath = new vscode.ThemeIcon('loading~spin', new vscode.ThemeColor('terminal.ansiYellow'));
        } else {
          item.iconPath = new vscode.ThemeIcon('circle-outline');
        }

        // Set tooltip with detailed information
        item.tooltip = this.getDeploymentTooltip(deployment);

        // Set command to open deployment details
        item.command = {
          command: 'cloudflare-vercel-monitor.openWebView',
          title: 'View Deployment',
          arguments: [deployment.id, 'vercel']
        };

        return item;
      }));
    }
  }

  private getDeploymentTooltip(deployment: DeploymentInfo): string {
    const date = new Date(deployment.createdAt);
    const formattedDate = date.toLocaleString();

    let tooltip = `Project: ${deployment.name}\n`;
    tooltip += `Status: ${deployment.status}\n`;
    tooltip += `Environment: ${deployment.environment}\n`;
    tooltip += `Created: ${formattedDate}\n`;

    if (deployment.branch) {
      tooltip += `Branch: ${deployment.branch}\n`;
    }

    if (deployment.commitMessage) {
      tooltip += `Commit: ${deployment.commitMessage}\n`;
    }

    tooltip += `URL: ${deployment.url}`;

    return tooltip;
  }
}