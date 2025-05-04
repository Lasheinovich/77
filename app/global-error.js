"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Capture the exception with additional context
    Sentry.captureException(error, {
      tags: {
        component: "GlobalError",
      },
      extra: {
        resetAvailable: typeof reset === "function",
      },
    });
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50 px-4"
      aria-live="assertive"
    >
      <div className="max-w-md w-full space-y-8 p-6 bg-white rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-gray-600">
            An unexpected error has occurred.
          </p>
          <div className="mt-6">
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
