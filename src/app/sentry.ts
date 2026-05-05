/**
 * Sentry initialization. Conditional on `VITE_SENTRY_DSN` so dev runs and
 * forks without their own DSN never report. Loaded once from `main.tsx`.
 *
 * Browser-only — the Sentry React SDK pulls in DOM globals at import time.
 * We don't enable session replay or BrowserTracing here yet; revisit when
 * the user base is large enough to justify the bundle / quota.
 */

import * as Sentry from '@sentry/react';

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION,
    // Sample 10 % of errors in dev (handy for sanity-checking) and everything
    // in prod. Adjust once we have real volume.
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
  initialized = true;
}

/**
 * Re-export the bits the rest of the app needs so consumers don't import
 * `@sentry/react` directly. Keeps the integration boundary small.
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;
export const captureException = Sentry.captureException;
