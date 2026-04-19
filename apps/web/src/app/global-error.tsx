"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { location: "global-error-boundary", critical: "true" },
      level: "fatal",
    });
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Critical Error</h1>
            <p className="text-neutral-400">Something went seriously wrong. We&apos;ve been alerted.</p>
            {error.digest && (
              <p className="text-xs font-mono text-neutral-500">Error ID: {error.digest}</p>
            )}
            <button
              onClick={reset}
              className="px-4 py-2 bg-indigo-600 rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
