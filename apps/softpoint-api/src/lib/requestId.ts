import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';

const HEADER = 'x-request-id';

export function registerRequestId(fastify: FastifyInstance): void {
  fastify.addHook('onRequest', async (request, reply) => {
    const incoming = request.headers[HEADER];
    const id =
      typeof incoming === 'string' && incoming.trim()
        ? incoming.trim()
        : randomUUID();
    request.id = id;
    reply.header(HEADER, id);
  });
}
