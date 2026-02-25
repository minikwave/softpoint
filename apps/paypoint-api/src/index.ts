import Fastify from 'fastify';
import cors from '@fastify/cors';
import { paypointRoutes } from './routes/paypoint.js';
import { adminRoutes } from './routes/admin.js';

const server = Fastify({ logger: true });

async function main() {
  await server.register(cors, { origin: true });
  await server.register(paypointRoutes, { prefix: '/v1/paypoint' });
  await server.register(adminRoutes, { prefix: '/v1/admin' });

  const port = Number(process.env['API_PORT']) || 3000;
  const host = process.env['API_HOST'] ?? '0.0.0.0';

  await server.listen({ port, host });
  console.log(`PayPoint API listening at http://${host}:${port}`);
}

main().catch((err) => {
  server.log.error(err);
  process.exit(1);
});
