import * as vscode from 'vscode';
import { CloudflareApiClient } from '../api/cloudflareApiClient';
import { DeploymentInfo } from '../api/types';

export class CloudflareDeploymentsProvider implements vscode.TreeDataProvider<DeploymentTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<DeploymentTreeItem | undefined | null | void> = new vscode.EventEmitter<DeploymentTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<DeploymentTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private deployments: DeploymentInfo[] = [];

  constructor(private cloudflareApiClient: CloudflareApiClient) { }

  refresh(): Promise<void> {
    return this.cloudflareApiClient.getDeployments()
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
        if (deployment.status.includes('success') || deployment.status === 'ready') {
          item.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('terminal.ansiGreen'));
        } else if (deployment.status.includes('fail') || deployment.status.includes('error')) {
          item.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('terminal.ansiRed'));
        } else if (deployment.status.includes('building') || deployment.status === 'queued') {
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
          arguments: [deployment.id, 'cloudflare']
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

export class DeploymentTreeItem extends vscode.TreeItem {
  constructor(
    public readonly deployment: DeploymentInfo,
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.description = deployment.status;

    // Make URL clickable
    this.resourceUri = vscode.Uri.parse(deployment.url);
    this.contextValue = 'deployment';
  }
}