import * as vscode from 'vscode';
import { CloudflareApiClient } from './api/cloudflareApiClient';
import { VercelApiClient } from './api/vercelApiClient';
import { BuildDashboardPanel } from './views/buildDashboardPanel';
import { CloudflareDeploymentsProvider } from './views/cloudflareDeploymentsProvider';
import { VercelDeploymentsProvider } from './views/vercelDeploymentsProvider';

let statusBarItem: vscode.StatusBarItem;
let refreshTimer: NodeJS.Timeout | undefined;

export async function activate(context: vscode.ExtensionContext) {
  console.log('Cloudflare & Vercel Build Monitor is now active');

  // Create API clients
  const cloudflareApiClient = new CloudflareApiClient();
  const vercelApiClient = new VercelApiClient();

  // Create tree data providers
  const cloudflareProvider = new CloudflareDeploymentsProvider(cloudflareApiClient);
  const vercelProvider = new VercelDeploymentsProvider(vercelApiClient);

  // Register tree data providers
  vscode.window.registerTreeDataProvider('cloudflareDeployments', cloudflareProvider);
  vscode.window.registerTreeDataProvider('vercelDeployments', vercelProvider);

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.text = "$(cloud) CF & Vercel";
  statusBarItem.tooltip = "Cloudflare & Vercel Build Monitor";
  statusBarItem.command = "cloudflare-vercel-monitor.openWebView";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('cloudflare-vercel-monitor.refreshStatus', async () => {
      vscode.window.showInformationMessage('Refreshing build status...');
      await refreshDeployments(cloudflareProvider, vercelProvider);
    }),

    vscode.commands.registerCommand('cloudflare-vercel-monitor.openWebView', () => {
      BuildDashboardPanel.createOrShow(context.extensionUri, cloudflareApiClient, vercelApiClient);
    }),

    vscode.commands.registerCommand('cloudflare-vercel-monitor.configureTokens', async () => {
      await configureApiTokens();
      await refreshDeployments(cloudflareProvider, vercelProvider);
    })
  );

  // Set up automatic refresh timer
  setupRefreshTimer(cloudflareProvider, vercelProvider);

  // Check for API tokens on startup
  checkApiTokens(context);

  // Initial refresh of deployments
  refreshDeployments(cloudflareProvider, vercelProvider);
}

async function refreshDeployments(
  cloudflareProvider: CloudflareDeploymentsProvider,
  vercelProvider: VercelDeploymentsProvider
): Promise<void> {
  try {
    await Promise.all([
      cloudflareProvider.refresh(),
      vercelProvider.refresh()
    ]);
  } catch (error) {
    console.error('Error refreshing deployments:', error);
    vscode.window.showErrorMessage('Failed to refresh deployment status: ' + (error instanceof Error ? error.message : String(error)));
  }
}

function setupRefreshTimer(
  cloudflareProvider: CloudflareDeploymentsProvider,
  vercelProvider: VercelDeploymentsProvider
): void {
  // Clear existing timer if it exists
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  // Get refresh interval from settings (default to 60 seconds)
  const config = vscode.workspace.getConfiguration('cloudflare-vercel-monitor');
  const refreshIntervalInSeconds = config.get<number>('refreshInterval') || 60;

  // Set up new timer
  refreshTimer = setInterval(async () => {
    await refreshDeployments(cloudflareProvider, vercelProvider);
  }, refreshIntervalInSeconds * 1000);
}

async function configureApiTokens(): Promise<void> {
  const config = vscode.workspace.getConfiguration('cloudflare-vercel-monitor');

  // Configure Cloudflare tokens
  const cloudflareToken = await vscode.window.showInputBox({
    prompt: 'Enter your Cloudflare API Token',
    password: true,
    value: config.get('cloudflareToken') || ''
  });

  if (cloudflareToken !== undefined) {
    await config.update('cloudflareToken', cloudflareToken, vscode.ConfigurationTarget.Global);
  }

  const cloudflareAccountId = await vscode.window.showInputBox({
    prompt: 'Enter your Cloudflare Account ID',
    value: config.get('cloudflareAccountId') || ''
  });

  if (cloudflareAccountId !== undefined) {
    await config.update('cloudflareAccountId', cloudflareAccountId, vscode.ConfigurationTarget.Global);
  }

  // Configure Vercel token
  const vercelToken = await vscode.window.showInputBox({
    prompt: 'Enter your Vercel API Token',
    password: true,
    value: config.get('vercelToken') || ''
  });

  if (vercelToken !== undefined) {
    await config.update('vercelToken', vercelToken, vscode.ConfigurationTarget.Global);
  }
}

function checkApiTokens(context: vscode.ExtensionContext): void {
  const config = vscode.workspace.getConfiguration('cloudflare-vercel-monitor');

  // Check if API tokens are configured
  const cloudflareToken = config.get('cloudflareToken');
  const cloudflareAccountId = config.get('cloudflareAccountId');
  const vercelToken = config.get('vercelToken');

  if (!cloudflareToken || !cloudflareAccountId || !vercelToken) {
    const message = 'Cloudflare & Vercel API tokens need to be configured to fetch build status.';
    const configureButton = 'Configure Now';

    vscode.window.showWarningMessage(message, configureButton).then(selection => {
      if (selection === configureButton) {
        vscode.commands.executeCommand('cloudflare-vercel-monitor.configureTokens');
      }
    });
  }
}

export function deactivate() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  statusBarItem.dispose();
}