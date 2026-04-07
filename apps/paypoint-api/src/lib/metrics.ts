import type { FastifyInstance, FastifyRequest } from 'fastify';
import {
  Registry,
  collectDefaultMetrics,
  Histogram,
  Counter,
} from 'prom-client';

const register = new Registry();

let initialized = false;

const httpDuration = new Histogram({
  name: 'paypoint_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const httpRequests = new Counter({
  name: 'paypoint_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export function isPrometheusMetricsEnabled(): boolean {
  const v = process.env['ENABLE_PROMETHEUS_METRICS']?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

export function initPrometheusMetrics(): void {
  if (initialized) return;
  initialized = true;
  collectDefaultMetrics({ register, prefix: 'paypoint_node_' });
}

export async function metricsText(): Promise<string> {
  return register.metrics();
}

const UNKNOWN_ROUTE = 'unknown';

function routeLabel(request: FastifyRequest): string {
  const pattern = request.routeOptions?.url;
  if (pattern && pattern.length > 0) return pattern;
  const u = request.url?.split('?')[0];
  return u && u.length > 0 ? u : UNKNOWN_ROUTE;
}

export function registerMetricsHooks(fastify: FastifyInstance): void {
  if (!isPrometheusMetricsEnabled()) return;
  initPrometheusMetrics();

  fastify.addHook('onResponse', async (request, reply) => {
    const route = routeLabel(request);
    const status = String(reply.statusCode);
    const labels = { method: request.method, route, status_code: status };
    httpRequests.inc(labels);
    const ms = reply.elapsedTime;
    if (typeof ms === 'number' && !Number.isNaN(ms)) {
      httpDuration.observe(labels, ms / 1000);
    }
  });
}
