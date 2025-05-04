// @ts-check
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone", // For containerized environments, but can be deployed anywhere
  poweredByHeader: false,
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "vercel.app",
        "netlify.app",
        "cloudflarepreview.com",
        "globalarkacademy.org",
        "arkacademy.org",
      ],
    },
    optimizeCss: true, // Enable modern optimizations
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "lucide-react",
      "@tensorflow/tfjs",
    ],
  },
  // Improved error handling
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },
  // Transpile problematic dependencies
  transpilePackages: ["three", "@tensorflow/tfjs", "@huggingface/inference"],
  // Enable proper environment variable handling
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || "2.1.0",
    NEXT_PUBLIC_API_GATEWAY_URL:
      process.env.NEXT_PUBLIC_API_GATEWAY_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://api-prod.arkacademy.org"
        : process.env.NODE_ENV === "staging"
          ? "https://api-staging.arkacademy.org"
          : "http://localhost:3001"),
    NEXT_PUBLIC_HUGGINGFACE_HUB_URL:
      process.env.NEXT_PUBLIC_HUGGINGFACE_HUB_URL || "https://huggingface.co",
  },
  // Image optimization settings - cloud provider neutral
  images: {
    domains: [
      "arkacademy.org",
      "globalarkacademy.org",
      "s3.amazonaws.com",
      "ark7-divine-dev-static-content.s3.amazonaws.com",
      "ark7-divine-staging-static-content.s3.amazonaws.com",
      "ark7-divine-prod-static-content.s3.amazonaws.com",
      "huggingface.co",
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
  },
  // Headers for security enhancement
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests;",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer, dev }) => {
    // Add polyfills or special loaders here if needed

    // Add WebAssembly support
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    // Optimize for AWS and Hugging Face
    if (!isServer && !dev) {
      // Reduce bundle size by analyzing and optimizing
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        // Optimize vendor chunks
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            // Safeguard against undefined module context
            const packageName =
              module.context &&
              module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1];

            if (!packageName) return "vendor";

            // Bundle large packages separately
            if (
              ["@tensorflow", "three", "@huggingface"].some((pkg) =>
                packageName.startsWith(pkg)
              )
            ) {
              return `vendor-${packageName.replace("@", "")}`;
            }

            return "vendor";
          },
          priority: 10,
          chunks: "all",
        },
      };
    }

    return config;
  },
};

// Add Sentry monitoring when in production builds
const withSentry =
  process.env.NODE_ENV === "production"
    ? withSentryConfig(nextConfig, {
        silent: true, // Suppresses Sentry plugin console logs
      })
    : nextConfig;

export default withSentry;
