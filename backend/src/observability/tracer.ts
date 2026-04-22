/**
 * OpenTelemetry agent/session trace helpers.
 * Works regardless of whether OTel SDK is initialized — if no-op, still traceable via console.
 */
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('finance-x', '1.0.0');

export async function traceAgent<T>(
  agentId: string,
  sessionId: string,
  phase: string,
  fn: () => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(`agent.${agentId}`, async (span) => {
    span.setAttribute('finance_x.session_id', sessionId);
    span.setAttribute('finance_x.agent_id', agentId);
    span.setAttribute('finance_x.phase', phase);

    const started = Date.now();
    try {
      const result = await fn();
      span.setAttribute('finance_x.duration_ms', Date.now() - started);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      span.recordException(err instanceof Error ? err : new Error(errMsg));
      span.setStatus({ code: SpanStatusCode.ERROR, message: errMsg });
      throw err;
    } finally {
      span.end();
    }
  });
}

export async function traceSession<T>(sessionId: string, ticker: string, fn: () => Promise<T>): Promise<T> {
  return tracer.startActiveSpan(`session.${ticker}`, async (span) => {
    span.setAttribute('finance_x.session_id', sessionId);
    span.setAttribute('finance_x.ticker', ticker);
    try {
      return await fn();
    } finally {
      span.end();
    }
  });
}
