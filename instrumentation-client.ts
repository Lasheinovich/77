// This file is used for instrumenting the client-side code
// It is automatically loaded by Next.js when present

import { BrowserTracing } from '@sentry/browser';
import * as Sentry from '@sentry/nextjs';

// Initialize Sentry only in production and staging environments
if (process.env.NEXT_PUBLIC_SENTRY_DSN &&
  (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging')) {

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    integrations: [
      new BrowserTracing({
        tracePropagationTargets: [
          // Add relevant backend domains
          "https://api.arkacademy.org",
          "https://api-staging.arkacademy.org",
          /^\/api\//,
        ],
      }),
    ],
    // Set tracesSampleRate to 1.0 for staging and lower for production
    tracesSampleRate: process.env.NODE_ENV === 'staging' ? 1.0 : 0.2,
    // Only capture errors in production and staging
    enabled: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging',
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_VERSION || 'unknown',
    // Ignore some common noisy errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Network request failed',
      /^Non-Error promise rejection captured with keys/,
    ],
    // Add user context when available
    beforeSend(event) {
      // Don't send PII in events - remove emails or other sensitive data if present
      if (event.user?.email) {
        // Hash the email to maintain unique identity without sending PII
        event.user.email = `${event.user.email.split('@')[0].substring(0, 2)}***@${event.user.email.split('@')[1]}`;
      }
      return event;
    },
  });

  // Expose Sentry for manual instrumentation where needed
  window.Sentry = Sentry;
}

export function reportClientError(error: Error, context?: Record<string, any>) {
  console.error("Client error:", error);

  if (process.env.NODE_ENV !== 'development') {
    Sentry.captureException(error, {
      contexts: {
        custom_context: context || {},
        client_info: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
          connection: navigator?.connection ?
            // @ts-ignore - Connection API may not be available in all browsers
            { effectiveType: navigator.connection.effectiveType, downlink: navigator.connection.downlink } :
            'unknown'
        }
      }
    });
  }
}

// Declare Sentry on window for global access in development tools
declare global {
  interface Window {
    Sentry?: typeof Sentry;
  }
}