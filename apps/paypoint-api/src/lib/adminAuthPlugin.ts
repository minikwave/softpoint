import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { extractAdminApiKey, getRequiredAdminApiKey } from './adminAuth.js';

async function adminAuthHook(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const required = getRequiredAdminApiKey();
  if (!required) return;

  const provided = extractAdminApiKey(request.headers);
  if (!provided || provided !== required) {
    return reply.status(401).send({
      error: { code: 'UNAUTHORIZED', message: 'Invalid or missing admin API key' },
    });
  }
}

export const adminAuthPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', adminAuthHook);
});
