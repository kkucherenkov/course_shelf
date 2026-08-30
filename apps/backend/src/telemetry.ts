/**
 * OpenTelemetry SDK initialisation.
 *
 * This module runs BEFORE NestJS DI boots, so we read process.env directly
 * rather than going through AppConfig. This is the sole exception to the
 * "no process.env outside common/config" rule — there is no DI container yet.
 *
 * Call initTelemetry() near the top of bootstrap(), before app.listen(), so
 * that the SDK instruments HTTP and Prisma before the first request.
 * Wire shutdownTelemetry() into the SIGTERM handler so spans are flushed on
 * graceful shutdown.
 */
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';

// NodeSDK's published typings resolve as an `error` (any-like) type in strict
// mode — a known packaging quirk of the @opentelemetry/sdk-node package.
// We narrow the variable type to only the two methods we call so the rest of
// the codebase stays fully typed.
interface OtelSdk {
  start(): void;
  shutdown(): Promise<void>;
}

let sdk: OtelSdk | null = null;

export function initTelemetry(): void {
  const endpoint = process.env['OTEL_EXPORTER_OTLP_ENDPOINT'];
  if (!endpoint) {
    // No collector configured — OTel is disabled (dev / test without a collector).
    return;
  }

  sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // fs instrumentation is extremely noisy and low-value; disable it.
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();
}

export async function shutdownTelemetry(): Promise<void> {
  await sdk?.shutdown();
}
