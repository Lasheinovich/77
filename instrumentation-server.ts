// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
  console.warn("Sentry DSN is not set. Sentry will not be initialized.");
} else {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

    // Use tracesSampler for advanced sampling logic
    tracesSampler: (samplingContext) => {
      if (samplingContext.transactionContext.op === "http.server") {
        return 0.5; // Higher sampling rate for server transactions
      }
      return 0.2; // Default rate
    },

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: process.env.NODE_ENV === "development",

    // Enhanced server-side error tracking
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),

      // Ensure the Express integration is properly initialized
      new Sentry.Integrations.Express({
        app: undefined, // Replace undefined with your Express app instance if applicable
      }),

      // Database integrations with conditional initialization
      process.env.MONGO_URL ? new Sentry.Integrations.Mongo() : null,
      process.env.POSTGRES_URL ? new Sentry.Integrations.Postgres() : null,
    ].filter(Boolean), // Filter out null integrations
  });
}