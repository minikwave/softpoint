import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { listCreditProducts, getCreditProductById } from '../services/productCatalog.js';
import { redeemCreditProduct, listRedemptionsByUser } from '../services/redemption.js';
import { getIdempotentResponse, setIdempotentResponse } from '../services/idempotency.js';

function toHttpError(err: unknown): { statusCode: number; code: string; message: string } {
  const msg = err instanceof Error ? err.message : 'INTERNAL_ERROR';
  if (msg === 'INSUFFICIENT_BALANCE') return { statusCode: 402, code: msg, message: msg };
  if (msg === 'PRODUCT_NOT_FOUND') return { statusCode: 404, code: msg, message: msg };
  if (msg === 'INVALID_AMOUNT' || msg.startsWith('INVALID_')) return { statusCode: 400, code: msg, message: msg };
  return { statusCode: 500, code: 'INTERNAL_ERROR', message: 'Internal server error' };
}

export async function creditRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  fastify.get<{ Querystring: { category?: string; product_type?: string } }>(
    '/products',
    async (request, reply) => {
      const items = await listCreditProducts({
        category: request.query.category,
        productType: request.query.product_type,
      });
      return reply.send({ items });
    }
  );

  fastify.get<{ Params: { id: string } }>('/products/:id', async (request, reply) => {
    const product = await getCreditProductById(request.params.id);
    if (!product) {
      return reply.status(404).send({
        error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
      });
    }
    return reply.send(product);
  });

  fastify.post<{
    Body: { user_id: string; product_id: string; idempotency_key?: string };
  }>('/redeem', async (request, reply) => {
    const body = request.body;
    const idempotencyKey =
      body.idempotency_key?.trim() || `redeem:${body.user_id}:${body.product_id}`;

    const stored = await getIdempotentResponse(idempotencyKey);
    if (stored) {
      return reply.status(200).send(stored);
    }

    try {
      const result = await redeemCreditProduct({
        userId: body.user_id,
        productId: body.product_id,
        idempotencyKey,
      });
      await setIdempotentResponse(idempotencyKey, result);
      return reply.status(201).send(result);
    } catch (err) {
      const e = toHttpError(err);
      return reply.status(e.statusCode).send({ error: { code: e.code, message: e.message } });
    }
  });

  fastify.get<{ Querystring: { user_id: string; limit?: string } }>(
    '/redemptions',
    async (request, reply) => {
      const { user_id, limit = '50' } = request.query;
      if (!user_id?.trim()) {
        return reply.status(400).send({
          error: { code: 'INVALID_USER_ID', message: 'user_id is required' },
        });
      }
      const take = Math.min(Number.parseInt(limit, 10) || 50, 100);
      const items = await listRedemptionsByUser(user_id.trim(), take);
      return reply.send({ user_id: user_id.trim(), items });
    }
  );
}
