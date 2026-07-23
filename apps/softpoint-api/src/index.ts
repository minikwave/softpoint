import Fastify from 'fastify';
import cors from '@fastify/cors';
import { paypointRoutes } from './routes/paypoint.js';
import { creditRoutes } from './routes/credits.js';
import { receiptRoutes } from './routes/receipts.js';
import { adminRoutes } from './routes/admin.js';
import { softpayWebhookRoutes } from './routes/softpayWebhook.js';
import { userAuthPlugin } from './lib/userAuthPlugin.js';
import { adminAuthPlugin } from './lib/adminAuthPlugin.js';
import { registerRequestId } from './lib/requestId.js';
import {
  isPrometheusMetricsEnabled,
  metricsText,
  registerMetricsHooks,
  metricsContentType,
} from './lib/metrics.js';

const server = Fastify({ logger: true });

async function main() {
  await server.register(cors, { origin: true });
  registerRequestId(server);

  if (isPrometheusMetricsEnabled()) {
    registerMetricsHooks(server);
    server.get('/metrics', async (_request, reply) => {
      reply.header('Content-Type', metricsContentType());
      return metricsText();
    });
  }

  server.get('/health', async () => ({ status: 'ok', service: 'softpoint-api' }));

  /** SoftPay webhook needs raw body for HMAC — encapsulate before JSON routes */
  await server.register(async (scope) => {
    scope.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
      done(null, body);
    });
    await scope.register(softpayWebhookRoutes);
  });

  await server.register(
    async (scope) => {
      await scope.register(userAuthPlugin);
      await scope.register(paypointRoutes);
      await scope.register(creditRoutes, { prefix: '/credits' });
      await scope.register(receiptRoutes, { prefix: '/receipts' });
    },
    { prefix: '/v1/paypoint' }
  );

  await server.register(
    async (scope) => {
      await scope.register(adminAuthPlugin);
      await scope.register(adminRoutes);
    },
    { prefix: '/v1/admin' }
  );

  const port = Number(process.env['PORT'] ?? process.env['API_PORT']) || 3000;
  const host = process.env['API_HOST'] ?? '0.0.0.0';

  await server.listen({ port, host });
  console.log(`SoftPoint API listening at http://${host}:${port}`);
}

main().catch((err) => {
  server.log.error(err);
  process.exit(1);
});
