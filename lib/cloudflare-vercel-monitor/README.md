# Cloudflare & Vercel Build Monitor

A Visual Studio Code extension for monitoring your Cloudflare Pages and Vercel deployments directly inside VS Code.

## Features

- **Deployment Status Monitoring**: View the status of your Cloudflare Pages and Vercel deployments from the VS Code sidebar
- **Real-time Updates**: Auto-refresh deployment statuses at configurable intervals
- **Detailed Build Logs**: View detailed build logs for each deployment in a dedicated webview panel
- **Fast Navigation**: Easily open deployment URLs directly from VS Code
- **Status Integration**: Shows deployment status in the VS Code status bar

## Requirements

- Visual Studio Code version 1.75.0 or higher
- Cloudflare API Token with Pages permissions
- Cloudflare Account ID
- Vercel API Token

## Getting Started

1. Install the extension from the VS Code Marketplace
2. Configure your API tokens using the "Configure API Tokens" command from the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
3. View your deployments in the activity bar sidebar under the Cloudflare & Vercel icon

## Extension Settings

This extension contributes the following settings:

- `cloudflare-vercel-monitor.cloudflareToken`: Cloudflare API Token
- `cloudflare-vercel-monitor.cloudflareAccountId`: Cloudflare Account ID
- `cloudflare-vercel-monitor.vercelToken`: Vercel API Token
- `cloudflare-vercel-monitor.refreshInterval`: Refresh interval in seconds (default: 60)

## Commands

- `Cloudflare & Vercel Monitor: Refresh Build Status`: Manually refresh the deployment status
- `Cloudflare & Vercel Monitor: Open Build Dashboard`: Open the build logs dashboard view
- `Cloudflare & Vercel Monitor: Configure API Tokens`: Set up or update your API tokens

## How to Get API Tokens

### Cloudflare

1. Log in to your Cloudflare account
2. Navigate to "My Profile" > "API Tokens"
3. Create a new token with "Pages:Read" permissions
4. Your Account ID can be found in the URL when logged into the Cloudflare dashboard: `https://dash.cloudflare.com/<account-id>/`

### Vercel

1. Log in to your Vercel account
2. Navigate to "Settings" > "Tokens"
3. Create a new token with "Read" scope

## Security Notes

- Your API tokens are stored in VS Code's secure storage
- Tokens are only used to communicate with Cloudflare and Vercel APIs
- No data is sent to any third-party services

## Feedback and Contributions

Feel free to [open an issue](https://github.com/ark7/cloudflare-vercel-monitor) for feature requests or bug reports.

## License

This extension is licensed under the MIT License.
