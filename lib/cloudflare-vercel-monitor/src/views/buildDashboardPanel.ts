import * as vscode from 'vscode';
import { CloudflareApiClient } from '../api/cloudflareApiClient';
import { VercelApiClient } from '../api/vercelApiClient';

export class BuildDashboardPanel {
  public static currentPanel: BuildDashboardPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _currentDeploymentId: string | undefined;
  private _currentProvider: 'cloudflare' | 'vercel' = 'cloudflare';
  private _autoRefreshInterval: NodeJS.Timeout | undefined;

  public static createOrShow(
    extensionUri: vscode.Uri,
    cloudflareApiClient: CloudflareApiClient,
    vercelApiClient: VercelApiClient,
    deploymentId?: string,
    provider?: 'cloudflare' | 'vercel'
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (BuildDashboardPanel.currentPanel) {
      BuildDashboardPanel.currentPanel._panel.reveal(column);

      // Update the deployment if a new one is provided
      if (deploymentId) {
        BuildDashboardPanel.currentPanel.updateDeployment(
          deploymentId,
          provider || 'cloudflare',
          cloudflareApiClient,
          vercelApiClient
        );
      }
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'buildDashboard',
      'Deployment Dashboard',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'resources')]
      }
    );

    BuildDashboardPanel.currentPanel = new BuildDashboardPanel(
      panel,
      extensionUri,
      cloudflareApiClient,
      vercelApiClient
    );

    // Update with specific deployment if provided
    if (deploymentId) {
      BuildDashboardPanel.currentPanel.updateDeployment(
        deploymentId,
        provider || 'cloudflare',
        cloudflareApiClient,
        vercelApiClient
      );
    } else {
      // Otherwise, show a welcome screen
      BuildDashboardPanel.currentPanel.showWelcomePage();
    }
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    private cloudflareApiClient: CloudflareApiClient,
    private vercelApiClient: VercelApiClient
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'openUrl':
            vscode.env.openExternal(vscode.Uri.parse(message.url));
            return;
          case 'refreshLogs':
            await this.refreshDeploymentData();
            return;
          case 'toggleAutoRefresh':
            this.toggleAutoRefresh(message.enabled);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  private toggleAutoRefresh(enabled: boolean) {
    if (this._autoRefreshInterval) {
      clearInterval(this._autoRefreshInterval);
      this._autoRefreshInterval = undefined;
    }

    if (enabled && this._currentDeploymentId) {
      this._autoRefreshInterval = setInterval(() => {
        this.refreshDeploymentData();
      }, 10000); // Refresh every 10 seconds
    }
  }

  public async updateDeployment(
    deploymentId: string,
    provider: 'cloudflare' | 'vercel',
    cloudflareApiClient: CloudflareApiClient,
    vercelApiClient: VercelApiClient
  ) {
    this._currentDeploymentId = deploymentId;
    this._currentProvider = provider;
    this.cloudflareApiClient = cloudflareApiClient;
    this.vercelApiClient = vercelApiClient;

    await this.refreshDeploymentData();
  }

  private async refreshDeploymentData() {
    if (!this._currentDeploymentId) {
      return;
    }

    try {
      // Get the API client based on provider
      const apiClient = this._currentProvider === 'cloudflare'
        ? this.cloudflareApiClient
        : this.vercelApiClient;

      // Fetch deployment details and logs
      const deploymentDetails = await apiClient.getDeploymentDetails(this._currentDeploymentId);
      const buildLogs = await apiClient.getBuildLogs(this._currentDeploymentId);

      // Update the webview with the data
      this._panel.webview.postMessage({
        type: 'update-deployment',
        deploymentDetails,
        buildLogs,
        provider: this._currentProvider
      });

      // Update panel title
      this._panel.title = `${deploymentDetails.name} - ${deploymentDetails.status}`;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to fetch deployment data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private showWelcomePage() {
    this._panel.webview.postMessage({
      type: 'show-welcome'
    });
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = "Deployment Dashboard";
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Deployment Dashboard</title>
      <style>
        body {
          font-family: var(--vscode-font-family);
          background-color: var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
          padding: 20px;
          line-height: 1.5;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .deployment-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
          padding: 15px;
          background-color: var(--vscode-editor-inactiveSelectionBackground);
          border-radius: 5px;
        }
        
        .deployment-info-row {
          display: flex;
          gap: 10px;
        }
        
        .info-label {
          min-width: 120px;
          font-weight: bold;
          color: var(--vscode-editor-foreground);
        }
        
        .info-value {
          flex: 1;
        }
        
        .info-value a {
          color: var(--vscode-textLink-foreground);
          text-decoration: none;
        }
        
        .info-value a:hover {
          text-decoration: underline;
        }
        
        .build-logs {
          background-color: var(--vscode-terminal-background);
          color: var(--vscode-terminal-foreground);
          font-family: var(--vscode-editor-font-family);
          padding: 15px;
          border-radius: 5px;
          overflow: auto;
          white-space: pre-wrap;
          height: calc(100vh - 300px);
          max-height: 600px;
        }
        
        .log-entry {
          margin-bottom: 8px;
          display: flex;
        }
        
        .log-timestamp {
          margin-right: 15px;
          color: var(--vscode-terminal-ansiBlue);
          min-width: 150px;
          user-select: none;
        }
        
        .log-message {
          flex: 1;
        }
        
        .log-info {
          color: var(--vscode-terminal-ansiWhite);
        }
        
        .log-warning {
          color: var(--vscode-terminal-ansiYellow);
        }
        
        .log-error {
          color: var(--vscode-terminal-ansiRed);
        }
        
        .buttons {
          margin-top: 20px;
          display: flex;
          gap: 10px;
        }
        
        button {
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          padding: 8px 16px;
          cursor: pointer;
          border-radius: 2px;
        }
        
        button:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
        
        .welcome-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 80vh;
          text-align: center;
        }
        
        .welcome-icon {
          font-size: 60px;
          margin-bottom: 20px;
        }
        
        .welcome-message {
          font-size: 18px;
          margin-bottom: 20px;
        }
        
        .provider-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          margin-left: 10px;
          font-size: 12px;
        }
        
        .cloudflare-badge {
          background-color: #f38020;
          color: white;
        }
        
        .vercel-badge {
          background-color: #000000;
          color: white;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          margin-left: 10px;
        }
        
        .status-success {
          background-color: var(--vscode-terminal-ansiGreen);
          color: var(--vscode-editor-background);
        }
        
        .status-building {
          background-color: var(--vscode-terminal-ansiYellow);
          color: var(--vscode-editor-background);
        }
        
        .status-error {
          background-color: var(--vscode-terminal-ansiRed);
          color: var(--vscode-editor-background);
        }
        
        .refresh-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .auto-refresh-toggle {
          display: flex;
          align-items: center;
          user-select: none;
        }
        
        /* Toggle switch styles */
        .switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 20px;
          margin-right: 8px;
        }
        
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--vscode-input-background);
          transition: .4s;
          border-radius: 34px;
        }
        
        .slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: var(--vscode-input-foreground);
          transition: .4s;
          border-radius: 50%;
        }
        
        input:checked + .slider {
          background-color: var(--vscode-button-background);
        }
        
        input:checked + .slider:before {
          transform: translateX(20px);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div id="welcome-view" class="welcome-container">
          <div class="welcome-icon">📊</div>
          <div class="welcome-message">Welcome to the Cloudflare & Vercel Build Monitor</div>
          <div>Select a deployment from the sidebar to view details and logs</div>
        </div>
        
        <div id="deployment-view" style="display: none;">
          <div class="header">
            <h2 id="deployment-title">Deployment Details</h2>
            <div class="refresh-controls">
              <label class="auto-refresh-toggle">
                <span class="switch">
                  <input type="checkbox" id="auto-refresh-toggle">
                  <span class="slider"></span>
                </span>
                Auto-refresh
              </label>
              <button id="refresh-button">Refresh</button>
            </div>
          </div>
          
          <div class="deployment-info">
            <div class="deployment-info-row">
              <span class="info-label">Project:</span>
              <span class="info-value" id="project-name"></span>
            </div>
            <div class="deployment-info-row">
              <span class="info-label">Status:</span>
              <span class="info-value" id="deployment-status"></span>
            </div>
            <div class="deployment-info-row">
              <span class="info-label">Environment:</span>
              <span class="info-value" id="deployment-environment"></span>
            </div>
            <div class="deployment-info-row">
              <span class="info-label">Created:</span>
              <span class="info-value" id="deployment-created"></span>
            </div>
            <div class="deployment-info-row">
              <span class="info-label">Branch:</span>
              <span class="info-value" id="deployment-branch"></span>
            </div>
            <div class="deployment-info-row">
              <span class="info-label">Commit:</span>
              <span class="info-value" id="deployment-commit"></span>
            </div>
            <div class="deployment-info-row">
              <span class="info-label">URL:</span>
              <span class="info-value"><a href="#" id="deployment-url"></a></span>
            </div>
          </div>
          
          <h3>Build Logs</h3>
          <div class="build-logs" id="build-logs"></div>
          
          <div class="buttons">
            <button id="open-url-button">Open Deployment URL</button>
          </div>
        </div>
      </div>
      
      <script>
        (function() {
          const vscode = acquireVsCodeApi();
          
          // DOM elements
          const welcomeView = document.getElementById('welcome-view');
          const deploymentView = document.getElementById('deployment-view');
          const refreshButton = document.getElementById('refresh-button');
          const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
          const openUrlButton = document.getElementById('open-url-button');
          
          let currentDeploymentUrl = '';
          
          // Event listeners
          refreshButton.addEventListener('click', () => {
            vscode.postMessage({ command: 'refreshLogs' });
          });
          
          autoRefreshToggle.addEventListener('change', () => {
            vscode.postMessage({ 
              command: 'toggleAutoRefresh', 
              enabled: autoRefreshToggle.checked 
            });
          });
          
          openUrlButton.addEventListener('click', () => {
            if (currentDeploymentUrl) {
              vscode.postMessage({ 
                command: 'openUrl', 
                url: currentDeploymentUrl 
              });
            }
          });
          
          // Handle messages from the extension
          window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
              case 'show-welcome':
                showWelcomePage();
                break;
                
              case 'update-deployment':
                updateDeploymentDetails(
                  message.deploymentDetails, 
                  message.buildLogs,
                  message.provider
                );
                break;
            }
          });
          
          function showWelcomePage() {
            welcomeView.style.display = 'flex';
            deploymentView.style.display = 'none';
          }
          
          function updateDeploymentDetails(deployment, logs, provider) {
            welcomeView.style.display = 'none';
            deploymentView.style.display = 'block';
            
            // Update deployment title
            const titleElement = document.getElementById('deployment-title');
            titleElement.textContent = deployment.name;
            
            // Add provider badge
            const existingBadge = titleElement.querySelector('.provider-badge');
            if (existingBadge) {
              existingBadge.remove();
            }
            
            const badge = document.createElement('span');
            badge.textContent = provider === 'cloudflare' ? 'Cloudflare' : 'Vercel';
            badge.className = \`provider-badge \${provider === 'cloudflare' ? 'cloudflare-badge' : 'vercel-badge'}\`;
            titleElement.appendChild(badge);
            
            // Update deployment info
            document.getElementById('project-name').textContent = deployment.name;
            
            const statusElem = document.getElementById('deployment-status');
            statusElem.textContent = deployment.status;
            
            // Add status badge
            const statusClass = getStatusClass(deployment.status);
            statusElem.innerHTML = \`\${deployment.status} <span class="status-badge \${statusClass}">\${deployment.status}</span>\`;
            
            document.getElementById('deployment-environment').textContent = deployment.environment;
            
            const createdDate = new Date(deployment.createdAt);
            document.getElementById('deployment-created').textContent = createdDate.toLocaleString();
            
            document.getElementById('deployment-branch').textContent = deployment.branch || 'N/A';
            document.getElementById('deployment-commit').textContent = deployment.commitMessage || 'N/A';
            
            const urlElement = document.getElementById('deployment-url');
            urlElement.textContent = deployment.url;
            urlElement.href = deployment.url;
            currentDeploymentUrl = deployment.url;
            
            // Update build logs
            const logsContainer = document.getElementById('build-logs');
            logsContainer.innerHTML = '';
            
            if (logs.length === 0) {
              logsContainer.innerHTML = '<div class="log-entry"><span class="log-message log-info">No logs available for this deployment.</span></div>';
            } else {
              logs.forEach(log => {
                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry';
                
                const timestamp = document.createElement('span');
                timestamp.className = 'log-timestamp';
                timestamp.textContent = log.timestamp;
                
                const message = document.createElement('span');
                message.className = \`log-message log-\${log.level}\`;
                message.textContent = log.message;
                
                logEntry.appendChild(timestamp);
                logEntry.appendChild(message);
                logsContainer.appendChild(logEntry);
              });
              
              // Scroll to bottom
              logsContainer.scrollTop = logsContainer.scrollHeight;
            }
          }
          
          function getStatusClass(status) {
            const lowerStatus = status.toLowerCase();
            if (lowerStatus.includes('success') || lowerStatus === 'ready') {
              return 'status-success';
            } else if (lowerStatus.includes('fail') || lowerStatus.includes('error')) {
              return 'status-error';
            } else if (lowerStatus.includes('building') || lowerStatus === 'queued') {
              return 'status-building';
            }
            return '';
          }
        }());
      </script>
    </body>
    </html>`;
  }

  public dispose() {
    if (this._autoRefreshInterval) {
      clearInterval(this._autoRefreshInterval);
    }

    BuildDashboardPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}