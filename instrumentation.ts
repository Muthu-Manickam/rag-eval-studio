/**
 * Next.js instrumentation hook.
 *
 * Registers Langfuse as the OpenTelemetry exporter and enables the AI SDK's
 * telemetry integration, so every `generateText` / `streamText` /
 * `generateObject` / `embed` call is traced in Langfuse.
 *
 * Everything here is gated on LANGFUSE_* credentials: without them the app runs
 * fully in mock mode and no telemetry is emitted.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) return;

  try {
    const { trace, context } = await import('@opentelemetry/api');
    const { BasicTracerProvider } = await import('@opentelemetry/sdk-trace-base');
    const { AsyncLocalStorageContextManager } = await import(
      '@opentelemetry/context-async-hooks'
    );
    const { LangfuseSpanProcessor } = await import('@langfuse/otel');
    const { registerTelemetry } = await import('ai');
    const { LangfuseVercelAiSdkIntegration } = await import('@langfuse/vercel-ai-sdk');

    context.setGlobalContextManager(new AsyncLocalStorageContextManager());

    const provider = new BasicTracerProvider({
      spanProcessors: [new LangfuseSpanProcessor()],
    });
    trace.setGlobalTracerProvider(provider);

    registerTelemetry(new LangfuseVercelAiSdkIntegration());
    console.log('[langfuse] tracing enabled');
  } catch (error) {
    console.warn('[langfuse] failed to initialise tracing', error);
  }
}
