import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { getAccountByUserId, decimalToBigint } from '../services/account.js';
import { issueCredit } from '../services/issue.js';
import { spendCredit } from '../services/spend.js';
import { getIdempotentResponse, setIdempotentResponse } from '../services/idempotency.js';
import { requestConversion, getConversion, listConversionsByUser } from '../services/conversion.js';
import { prisma } from '../lib/prisma.js';
import { isUserJwtEnforced, verifyUserBearerToken } from '../lib/userJwt.js';

const PARAM_USER_ID = 'user_id';

function userMatchesJwt(request: FastifyRequest, userId: string, reply: FastifyReply): boolean {
  if (!isUserJwtEnforced()) return true;
  if (!request.jwtUserId || request.jwtUserId !== userId) {
    void reply.status(403).send({
      error: { code: 'FORBIDDEN', message: 'JWT sub must match user_id for this operation' },
    });
    return false;
  }
  return true;
}

function storedUserId(obj: unknown): string | undefined {
  if (obj && typeof obj === 'object' && 'userId' in obj && typeof (obj as { userId: unknown }).userId === 'string') {
    return (obj as { userId: string }).userId;
  }
  return undefined;
}

/**
 * Map domain/engine errors to HTTP status and body.
 */
function toHttpError(err: unknown): { statusCode: number; code: string; message: string } {
  const msg = err instanceof Error ? err.message : 'INTERNAL_ERROR';
  if (msg === 'INSUFFICIENT_BALANCE') return { statusCode: 402, code: 'INSUFFICIENT_BALANCE', message: msg };
  if (msg === 'ACCOUNT_NOT_FOUND' || msg === 'CONVERSION_NOT_FOUND') return { statusCode: 404, code: msg, message: msg };
  if (msg === 'INVALID_AMOUNT' || msg.startsWith('INVALID_') || msg === 'CONVERSION_INVALID_STATUS') return { statusCode: 400, code: msg, message: msg };
  return { statusCode: 500, code: 'INTERNAL_ERROR', message: 'Internal server error' };
}

export async function paypointRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  if (isUserJwtEnforced()) {
    fastify.addHook('onRequest', async (request, reply) => {
      const auth = request.headers.authorization;
      if (!auth?.startsWith('Bearer ')) {
        return reply.status(401).send({
          error: { code: 'UNAUTHORIZED', message: 'Bearer token required (USER_JWT_SECRET is set)' },
        });
      }
      try {
        request.jwtUserId = await verifyUserBearerToken(auth.slice(7).trim());
      } catch {
        return reply.status(401).send({
          error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
        });
      }
    });
  }

  // GET /v1/paypoint/balance/:user_id
  fastify.get<{ Params: Record<typeof PARAM_USER_ID, string> }>(
    '/balance/:user_id',
    async (request, reply) => {
      const userId = request.params[PARAM_USER_ID];
      if (!userMatchesJwt(request, userId, reply)) return;
      const account = await getAccountByUserId(userId);
      if (!account) {
        return reply.status(404).send({
          error: { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found' },
        });
      }
      const balance = decimalToBigint(account.balance);
      const reserved = decimalToBigint(account.reservedBalance);
      const available = balance - reserved;
      return reply.send({
        user_id: account.userId,
        balance: balance.toString(),
        reserved_balance: reserved.toString(),
        available: available.toString(),
      });
    }
  );

  // GET /v1/paypoint/transactions
  fastify.get<{
    Querystring: { user_id: string; limit?: string; cursor?: string };
  }>('/transactions', async (request, reply) => {
    const { user_id, limit = '20', cursor } = request.query;
    if (!userMatchesJwt(request, user_id, reply)) return;
    const take = Math.min(Number.parseInt(limit, 10) || 20, 100);
    const account = await getAccountByUserId(user_id);
    if (!account) {
      return reply.status(404).send({
        error: { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found' },
      });
    }
    const items = await prisma.paypointTransaction.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = items.length > take;
    const list = hasMore ? items.slice(0, take) : items;
    const nextCursor = hasMore ? list[list.length - 1]?.id ?? null : null;
    return reply.send({
      user_id: user_id,
      items: list.map((t: { id: string; accountId: string; type: string; amount: { toString(): string }; orderId: string | null; receiptId: string | null; metadata: unknown; createdAt: Date }) => ({
        tx_id: t.id,
        account_id: t.accountId,
        type: t.type,
        amount: t.amount.toString(),
        order_id: t.orderId ?? undefined,
        receipt_id: t.receiptId ?? undefined,
        metadata: t.metadata ?? undefined,
        created_at: t.createdAt.toISOString(),
      })),
      next_cursor: nextCursor,
    });
  });

  // POST /v1/paypoint/issue (optional idempotency_key — replays return 200 + same body)
  fastify.post<{
    Body: {
      user_id: string;
      amount: string;
      reason: string;
      expires_at?: string;
      idempotency_key?: string;
      source?: string;
      external_ref?: string;
      campaign_id?: string;
    };
  }>('/issue', async (request, reply) => {
    const body = request.body;
    if (!userMatchesJwt(request, body.user_id, reply)) return;
    const amount = BigInt(body.amount);
    if (amount <= 0n) {
      return reply.status(400).send({
        error: { code: 'INVALID_AMOUNT', message: 'Amount must be positive' },
      });
    }

    const idempotencyKey = body.idempotency_key?.trim();
    if (idempotencyKey) {
      const stored = await getIdempotentResponse(idempotencyKey);
      if (stored) {
        const su = storedUserId(stored);
        if (su && !userMatchesJwt(request, su, reply)) return;
        return reply.status(200).send(stored);
      }
    }

    try {
      const result = await issueCredit({
        userId: body.user_id,
        amount,
        reason: body.reason,
        expiresAt: body.expires_at,
        source: body.source,
        externalRef: body.external_ref,
        campaignId: body.campaign_id,
      });
      if (idempotencyKey) {
        await setIdempotentResponse(idempotencyKey, result as object);
      }
      return reply.status(201).send(result);
    } catch (err) {
      const e = toHttpError(err);
      return reply.status(e.statusCode).send({ error: { code: e.code, message: e.message } });
    }
  });

  // POST /v1/paypoint/spend (with idempotency key support)
  fastify.post<{
    Body: { user_id: string; amount: string; order_id: string; idempotency_key?: string };
  }>('/spend', async (request, reply) => {
    const body = request.body;
    const amount = BigInt(body.amount);
    if (amount <= 0n) {
      return reply.status(400).send({
        error: { code: 'INVALID_AMOUNT', message: 'Amount must be positive' },
      });
    }

    if (!userMatchesJwt(request, body.user_id, reply)) return;

    const idempotencyKey =
      body.idempotency_key ?? `spend:${body.user_id}:${body.order_id}`;
    const stored = await getIdempotentResponse(idempotencyKey);
    if (stored) {
      const su = storedUserId(stored);
      if (su && !userMatchesJwt(request, su, reply)) return;
      return reply.status(200).send(stored);
    }

    try {
      const result = await spendCredit({
        userId: body.user_id,
        amount,
        orderId: body.order_id,
      });
      await setIdempotentResponse(idempotencyKey, result);
      return reply.status(200).send(result);
    } catch (err) {
      const e = toHttpError(err);
      return reply.status(e.statusCode).send({ error: { code: e.code, message: e.message } });
    }
  });

  // POST /v1/paypoint/conversion/request — request PayPoint → Stable conversion (MVP: MERCHANT_SETTLEMENT)
  // Optional idempotency: idempotency_key (full key) or client_request_id → key conversion:{user_id}:{client_request_id}
  fastify.post<{
    Body: {
      user_id: string;
      type: string;
      from_amount: string;
      to_asset: string;
      to_chain_id?: number;
      idempotency_key?: string;
      client_request_id?: string;
    };
  }>('/conversion/request', async (request, reply) => {
    const body = request.body;
    if (!userMatchesJwt(request, body.user_id, reply)) return;
    const amount = BigInt(body.from_amount);
    if (amount <= 0n) {
      return reply.status(400).send({
        error: { code: 'INVALID_AMOUNT', message: 'Amount must be positive' },
      });
    }

    const idemFull = body.idempotency_key?.trim();
    const clientRef = body.client_request_id?.trim();
    const idempotencyKey = idemFull
      ? idemFull
      : clientRef
        ? `conversion:${body.user_id}:${clientRef}`
        : undefined;

    if (idempotencyKey) {
      const stored = await getIdempotentResponse(idempotencyKey);
      if (stored) {
        const su = storedUserId(stored);
        if (su && !userMatchesJwt(request, su, reply)) return;
        return reply.status(200).send(stored);
      }
    }

    try {
      const result = await requestConversion({
        userId: body.user_id,
        type: body.type,
        fromAmount: amount,
        toAsset: body.to_asset,
        toChainId: body.to_chain_id,
      });
      if (idempotencyKey) {
        await setIdempotentResponse(idempotencyKey, result as object);
      }
      return reply.status(201).send(result);
    } catch (err) {
      const e = toHttpError(err);
      return reply.status(e.statusCode).send({ error: { code: e.code, message: e.message } });
    }
  });

  // GET /v1/paypoint/conversion/:id
  fastify.get<{ Params: { id: string } }>('/conversion/:id', async (request, reply) => {
    const conv = await getConversion(request.params.id);
    if (!conv) {
      return reply.status(404).send({
        error: { code: 'CONVERSION_NOT_FOUND', message: 'Conversion not found' },
      });
    }
    if (!userMatchesJwt(request, conv.userId, reply)) return;
    return reply.send(conv);
  });

  // GET /v1/paypoint/conversions — list conversions for a user (own list)
  fastify.get<{ Querystring: { user_id: string; limit?: string }   }>('/conversions', async (request, reply) => {
    const { user_id, limit = '50' } = request.query;
    if (!userMatchesJwt(request, user_id, reply)) return;
    const take = Math.min(Number.parseInt(limit, 10) || 50, 100);
    const items = await listConversionsByUser(user_id, take);
    return reply.send({ user_id, items });
  });
}
