import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { isUserJwtEnforced, verifyUserBearerToken } from './userJwt.js';

function bearerToken(request: FastifyRequest): string {
  const auth = request.headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return '';
}

/** Path / query / JSON body에서 요청된 user_id (없으면 null). */
export function requestedUserId(request: FastifyRequest): string | null {
  const params = request.params as Record<string, string | undefined>;
  if (params?.user_id?.trim()) return params.user_id.trim();

  const query = request.query as Record<string, string | undefined>;
  if (query?.user_id?.trim()) return query.user_id.trim();

  const body = request.body as Record<string, string | undefined> | undefined;
  if (body && typeof body.user_id === 'string' && body.user_id.trim()) {
    return body.user_id.trim();
  }

  return null;
}

async function userAuthHook(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!isUserJwtEnforced()) return;

  const token = bearerToken(request);
  if (!token) {
    return reply.status(401).send({
      error: { code: 'UNAUTHORIZED', message: 'Bearer token required' },
    });
  }

  try {
    const sub = await verifyUserBearerToken(token);
    request.jwtUserId = sub;

    const reqUid = requestedUserId(request);
    if (reqUid && reqUid !== sub) {
      return reply.status(403).send({
        error: { code: 'FORBIDDEN', message: 'JWT sub does not match user_id' },
      });
    }
  } catch {
    return reply.status(401).send({
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
    });
  }
}

export const userAuthPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', userAuthHook);
});
