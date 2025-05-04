# Ark7 Divine Frontend

This is the frontend application for the Ark7 Divine platform, built with Next.js 15, React 19, and styled with Tailwind CSS.

## Development Setup

### Prerequisites

- Node.js 18.x or later
- NPM 8.x or later (or PNPM 10.x which is preferred)
- Git

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/your-org/ark7-divine.git
   cd ark7-divine/frontend
   ```

2. Install dependencies:

   ```
   # If using npm
   npm install

   # If using pnpm (recommended)
   pnpm install
   ```

3. Set up environment variables:

   ```
   cp .env.example .env.local
   ```

   Then edit `.env.local` to add your environment-specific configuration.

4. Start the development server:

   ```
   npm run dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Lint the code with ESLint
- `npm run check-types` - Check TypeScript types
- `npm test` - Run tests
- `npm run deploy` - Build and deploy to Vercel (production)
- `npm run deploy:preview` - Deploy to Vercel (preview)

## Deployment

### Automatic Deployment via GitHub Actions

This project is set up with GitHub Actions for CI/CD. When you push to the `main` branch, it will automatically:

1. Build and test the application
2. Run security scans
3. Deploy to Vercel (production)

When you push to the `develop` branch, it will:

1. Build and test the application
2. Run security scans
3. Deploy to Vercel (staging/preview)

### Manual Deployment from Your Local Machine

For manual deployments, we've created a comprehensive deployment script:

```bash
# Windows
.\deploy-frontend.sh

# Unix/Linux/macOS
bash ./deploy-frontend.sh
```

This script will:

1. Validate your environment setup
2. Install dependencies
3. Run type checking, linting, and tests
4. Build the application
5. Deploy to Vercel
6. Generate detailed logs of the deployment process

Alternatively, you can use the NPM scripts:

```bash
# Deploy to production
npm run deploy

# Deploy to preview
npm run deploy:preview
```

### Environment Variables

The following environment variables can be set:

- `VERCEL_TOKEN` - Your Vercel authentication token (for CI/CD or non-interactive deployments)
- `NEXT_PUBLIC_API_URL` - URL of the backend API
- `NEXT_PUBLIC_APP_URL` - URL of the frontend application

## Project Structure

```
frontend/
├── app/                  # Next.js App Router files
├── components/           # Reusable React components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and services
├── public/               # Static assets
├── styles/               # Global styles
└── types/                # TypeScript type definitions
```

## Vercel Configuration

The project uses Vercel for hosting with the following configuration:

- Automatic preview deployments for pull requests
- Production deployments from the `main` branch
- Staging deployments from the `develop` branch
- Custom domains configured in Vercel dashboard

## Troubleshooting

If you encounter any issues during deployment, check:

1. Vercel authentication is configured correctly
2. All required environment variables are set
3. The project is linked to the correct Vercel project
4. Your branch is up to date with the remote

For more detailed logs, check the `.ark7_hyperlogs` directory which contains deployment logs and audit information.
