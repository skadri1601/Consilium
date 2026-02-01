// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Only initialize Sentry in production to reduce console noise in development
if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: "https://b34ec493f6c70851522234f15b393404@o4510644138541056.ingest.us.sentry.io/4510650917912576",

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: 1,

    // Enable sending user PII (Personally Identifiable Information)
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
    sendDefaultPii: true,

    // Session Replay
    replaysSessionSampleRate: 0.1, // Sample 10% of sessions
    replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors
    integrations: [
      Sentry.replayIntegration(),
    ],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
