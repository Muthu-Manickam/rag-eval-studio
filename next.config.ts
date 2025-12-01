import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@strands-agents/sdk',
    '@langfuse/otel',
    '@langfuse/tracing',
    '@langfuse/vercel-ai-sdk',
    '@opentelemetry/sdk-trace-base',
    '@opentelemetry/context-async-hooks',
  ],
};

export default nextConfig;
