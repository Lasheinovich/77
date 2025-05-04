"use client";

import "@/app/globals.css";
import { Providers } from "@/components/providers";
import { monitoring } from "@/lib/monitoring/init-monitoring";
import { initTelemetry } from "@/lib/telemetry";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Mona_Sans as FontSans } from "next/font/google";
import React, { useEffect } from "react";

// Initialize telemetry
initTelemetry();

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Initialize monitoring services
    monitoring.init();

    // Set up session tracking - SSR safe localStorage check
    if (typeof window !== "undefined") {
      const sessionId =
        localStorage.getItem("sessionId") || crypto.randomUUID();
      localStorage.setItem("sessionId", sessionId);

      // Add session context to monitoring
      monitoring.captureMessage("Session started", "info", { sessionId });
    }

    return () => {
      // Clean up monitoring on unmount
      if (typeof window !== "undefined") {
        const sessionId = localStorage.getItem("sessionId");
        if (sessionId) {
          monitoring.captureMessage("Session ended", "info", { sessionId });
        }
      }
    };
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Ark7 - Global Ark Academy" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <Providers>
          {children}
          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
