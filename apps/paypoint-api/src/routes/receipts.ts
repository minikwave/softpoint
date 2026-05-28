import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  getReceiptById,
  listReceiptEvents,
  listReceiptsForUser,
} from '../services/receipt.js';

export async function receiptRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  fastify.get<{ Querystring: { user_id: string; limit?: string } }>('/', async (request, reply) => {
    const { user_id, limit = '50' } = request.query;
    if (!user_id?.trim()) {
      return reply.status(400).send({
        error: { code: 'INVALID_USER_ID', message: 'user_id is required' },
      });
    }
    const take = Math.min(Number.parseInt(limit, 10) || 50, 100);
    const items = await listReceiptsForUser(user_id.trim(), take);
    return reply.send({ user_id: user_id.trim(), items });
  });

  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const receipt = await getReceiptById(request.params.id);
    if (!receipt) {
      return reply.status(404).send({
        error: { code: 'RECEIPT_NOT_FOUND', message: 'Receipt not found' },
      });
    }
    return reply.send(receipt);
  });

  fastify.get<{ Params: { id: string } }>('/:id/events', async (request, reply) => {
    const receipt = await getReceiptById(request.params.id);
    if (!receipt) {
      return reply.status(404).send({
        error: { code: 'RECEIPT_NOT_FOUND', message: 'Receipt not found' },
      });
    }
    const events = await listReceiptEvents(request.params.id);
    return reply.send({ receipt_id: request.params.id, items: events });
  });
}
