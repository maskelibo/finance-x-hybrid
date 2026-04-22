/**
 * OpenTelemetry Node SDK initialization.
 * Lazy-loaded: only requires sdk-node / exporter when OTEL_EXPORTER_URL is set.
 */

let sdk: unknown = null;

export async function initTracing(): Promise<void> {
  if (!process.env.OTEL_EXPORTER_URL) {
    console.log('[tracing] OTEL_EXPORTER_URL not set, skipping OTel init (tracing disabled)');
    return;
  }

  const { NodeSDK } = await import('@opentelemetry/sdk-node');
  const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
  const { resourceFromAttributes } = await import('@opentelemetry/resources');
  const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = await import('@opentelemetry/semantic-conventions');

  const instance = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'finance-x',
      [ATTR_SERVICE_VERSION]: '1.0.0',
    }),
    traceExporter: new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_URL }),
  });

  instance.start();
  sdk = instance;
  console.log(`[tracing] OpenTelemetry initialized → ${process.env.OTEL_EXPORTER_URL}`);
}

export async function shutdownTracing(): Promise<void> {
  if (sdk && typeof (sdk as { shutdown: () => Promise<void> }).shutdown === 'function') {
    await (sdk as { shutdown: () => Promise<void> }).shutdown();
    sdk = null;
  }
}
