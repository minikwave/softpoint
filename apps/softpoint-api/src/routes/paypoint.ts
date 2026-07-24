import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { Prisma } from '@prisma/client';
import { getAccountByUserId, decimalToBigint } from '../services/account.js';
import { issueCredit } from '../services/issue.js';
import { spendCredit } from '../services/spend.js';
import { getIdempotentResponse, setIdempotentResponse } from '../services/idempotency.js';
import { requestConversion, getConversion, listConversionsByUser } from '../services/conversion.js';
import { listEarnLocations } from '../services/earnLocations.js';
import { listEarnActivities, earnFromActivity } from '../services/earnActivities.js';
import { earnFromPayment } from '../services/paymentEarn.js';
import { listMarketListings } from '../services/market.js';
import { getPartnerSandboxInfo } from '../services/partner.js';
import { listOutboundEvents } from '../services/eventOutbox.js';
import { softPayEarnEnabled } from '../services/softpayEarnAdapter.js';
import { prisma } from '../lib/prisma.js';
import { resolveIdempotencyKey } from '../lib/idempotency-key.js';

const PARAM_USER_ID = 'user_id';

/**
 * Map domain/engine errors to HTTP status and body.
 */
function toHttpError(err: unknown): { statusCode: number; code: string; message: string } {
  const msg = err instanceof Error ? err.message : 'INTERNAL_ERROR';
  if (msg === 'INSUFFICIENT_BALANCE') return { statusCode: 402, code: 'INSUFFICIENT_BALANCE', message: msg };
  if (msg === 'ACCOUNT_NOT_FOUND' || msg === 'CONVERSION_NOT_FOUND' || msg === 'ACTIVITY_NOT_FOUND') return { statusCode: 404, code: msg, message: msg };
  if (msg === 'INVALID_AMOUNT' || msg.startsWith('INVALID_') || msg === 'CONVERSION_INVALID_STATUS') return { statusCode: 400, code: msg, message: msg };
  return { statusCode: 500, code: 'INTERNAL_ERROR', message: 'Internal server error' };
}

export async function paypointRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  // GET /v1/paypoint/info — SDK discovery & feature flags
  fastify.get('/info', async (_request, reply) => {
    return reply.send({
      service: 'softpoint-api',
      version: process.env['API_VERSION'] ?? '0.2.0',
      product: 'SoftPoint',
      unit: 'SP',
      softpay: {
        earn_webhook: '/hooks/softpay',
        earn_enabled: softPayEarnEnabled(),
        loyalty_rail: 'softpoint_sp',
        note: 'SoftPay Pilot loyalty only — SoftPG agent credit is out of scope',
      },
      features: [
        'balance',
        'issue',
        'spend',
        'earn-payment',
        'earn-activity',
        'credits-redeem',
        'receipts',
        'conversion',
        'market-demo',
        'partner-sandbox',
        'softpay-earn-webhook',
        'event-outbox-stub',
        'idempotency-key-body',
        'idempotency-key-header',
      ],
      idempotency: {
        body_field: 'idempotency_key',
        header_alias: 'Idempotency-Key',
        header_status: 'present',
        note: 'Header preferred, body fallback · Prisma idempotencyRecord replay — SoftPoint ≠ SoftPG',
        audit_doc: 'docs/IDEMPOTENCY_CROSS_AUDIT.md',
      },
      paths: {
        user: '/v1/paypoint',
        admin: '/v1/admin',
        health: '/health',
        softpay_hook: '/hooks/softpay',
      },
    });
  });

  // GET /v1/paypoint/events/outbound — SoftPay linkage event stub (in-memory)
  fastify.get<{ Querystring: { limit?: string } }>('/events/outbound', async (request, reply) => {
    const limit = Math.min(Number.parseInt(request.query.limit ?? '50', 10) || 50, 100);
    return reply.send({ items: listOutboundEvents(limit) });
  });

  // GET /v1/paypoint/partner/sandbox — 온보딩·샌드박스 메타 (P1-2 스텁)
  fastify.get('/partner/sandbox', async (_request, reply) => {
    return reply.send(getPartnerSandboxInfo());
  });

  // GET /v1/paypoint/market/listings — demo marketplace (Phase E: real listings)
  fastify.get('/market/listings', async (_request, reply) => {
    return reply.send({ items: listMarketListings() });
  });

  // GET /v1/paypoint/earn-locations
  fastify.get<{ Querystring: { category?: string } }>('/earn-locations', async (request, reply) => {
    const items = await listEarnLocations(request.query.category);
    return reply.send({ items });
  });

  // GET /v1/paypoint/earn-activities — Walk/광고/미션 등 활동형 적립 카탈로그
  fastify.get('/earn-activities', async (_request, reply) => {
    const items = await listEarnActivities();
    return reply.send({ items });
  });

  // POST /v1/paypoint/earn/activity — 파트너·앱에서 활동 완료 시 SP 지급
  fastify.post<{
    Body: {
      user_id: string;
      activity_slug: string;
      idempotency_key?: string;
      proof?: Record<string, unknown>;
    };
  }>('/earn/activity', async (request, reply) => {
    const body = request.body;
    if (!body.user_id?.trim() || !body.activity_slug?.trim()) {
      return reply.status(400).send({
        error: { code: 'INVALID_REQUEST', message: 'user_id and activity_slug required' },
      });
    }
    const idempotencyKey = resolveIdempotencyKey(request, body.idempotency_key);
    if (idempotencyKey) {
      const cached = await getIdempotentResponse(idempotencyKey);
      if (cached) return reply.send(cached);
    }
    try {
      const result = await earnFromActivity({
        userId: body.user_id.trim(),
        activitySlug: body.activity_slug.trim(),
        idempotencyKey,
        proof: body.proof,
      });
      if (idempotencyKey) await setIdempotentResponse(idempotencyKey, result);
      return reply.send(result);
    } catch (err) {
      const e = toHttpError(err);
      return reply.status(e.statusCode).send({ error: { code: e.code, message: e.message } });
    }
  });

  // POST /v1/paypoint/earn/payment — 결제 완료 후 적립 (파트너 pull · SoftPay Intent id 가능)
  fastify.post<{
    Body: {
      user_id: string;
      payment_amount: string;
      order_id: string;
      merchant_id?: string;
      idempotency_key?: string;
      softpay_intent_id?: string;
    };
  }>('/earn/payment', async (request, reply) => {
    const body = request.body;
    const paymentAmount = BigInt(body.payment_amount);
    if (paymentAmount <= 0n) {
      return reply.status(400).send({
        error: { code: 'INVALID_AMOUNT', message: 'payment_amount must be positive' },
      });
    }
    if (!body.order_id?.trim()) {
      return reply.status(400).send({
        error: { code: 'INVALID_ORDER_ID', message: 'order_id is required' },
      });
    }
    try {
      const softpayIntentId = body.softpay_intent_id?.trim() || undefined;
      const result = await earnFromPayment({
        userId: body.user_id,
        paymentAmount,
        orderId: body.order_id.trim(),
        merchantId: body.merchant_id,
        idempotencyKey: resolveIdempotencyKey(request, body.idempotency_key),
        softpayIntentId,
        softpayEvent: softpayIntentId ? 'earn.payment.softpay' : undefined,
      });
      const status = result.skipped ? 200 : 201;
      return reply.status(status).send(result);
    } catch (err) {
      const e = toHttpError(err);
      return reply.status(e.statusCode).send({ error: { code: e.code, message: e.message } });
    }
  });

  // GET /v1/paypoint/balance/:user_id
  fastify.get<{ Params: Record<typeof PARAM_USER_ID, string> }>(
    '/balance/:user_id',
    async (request, reply) => {
      const userId = request.params[PARAM_USER_ID];
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
    Querystring: { user_id: string; limit?: string; cursor?: string; type?: string; source?: string };
  }>('/transactions', async (request, reply) => {
    const { user_id, limit = '20', cursor, type, source } = request.query;
    const take = Math.min(Number.parseInt(limit, 10) || 20, 100);
    const account = await getAccountByUserId(user_id);
    if (!account) {
      return reply.status(404).send({
        error: { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found' },
      });
    }
    const where: Prisma.PaypointTransactionWhereInput = { accountId: account.id };
    if (type?.trim()) where.type = type.trim();
    if (source?.trim()) {
      where.metadata = { path: ['source'], equals: source.trim() };
    }
    const items = await prisma.paypointTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = items.length > take;
    const list = hasMore ? items.slice(0, take) : items;
    const nextCursor = hasMore ? list[list.length - 1]?.id ?? null : null;
    return reply.send({
      user_id: user_id,
      items: list.map(
        (t: {
          id: string;
          accountId: string;
          type: string;
          amount: { toString(): string };
          orderId: string | null;
          receiptId: string | null;
          metadata: unknown;
          createdAt: Date;
        }) => ({
          tx_id: t.id,
          account_id: t.accountId,
          type: t.type,
          amount: t.amount.toString(),
          order_id: t.orderId ?? undefined,
          receipt_id: t.receiptId ?? undefined,
          metadata: t.metadata ?? undefined,
          created_at: t.createdAt.toISOString(),
        })
      ),
      next_cursor: nextCursor,
    });
  });

  // POST /v1/paypoint/issue
  fastify.post<{
    Body: { user_id: string; amount: string; reason: string; expires_at?: string };
  }>('/issue', async (request, reply) => {
    const body = request.body;
    const amount = BigInt(body.amount);
    if (amount <= 0n) {
      return reply.status(400).send({
        error: { code: 'INVALID_AMOUNT', message: 'Amount must be positive' },
      });
    }
    try {
      const result = await issueCredit({
        userId: body.user_id,
        amount,
        reason: body.reason,
        expiresAt: body.expires_at,
      });
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

    const idempotencyKey =
      resolveIdempotencyKey(request, body.idempotency_key) ??
      `spend:${body.user_id}:${body.order_id}`;
    const stored = await getIdempotentResponse(idempotencyKey);
    if (stored) {
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
  fastify.post<{
    Body: { user_id: string; type: string; from_amount: string; to_asset: string; to_chain_id?: number };
  }>('/conversion/request', async (request, reply) => {
    const body = request.body;
    const amount = BigInt(body.from_amount);
    if (amount <= 0n) {
      return reply.status(400).send({
        error: { code: 'INVALID_AMOUNT', message: 'Amount must be positive' },
      });
    }
    try {
      const result = await requestConversion({
        userId: body.user_id,
        type: body.type,
        fromAmount: amount,
        toAsset: body.to_asset,
        toChainId: body.to_chain_id,
      });
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
    return reply.send(conv);
  });

  // GET /v1/paypoint/conversions — list conversions for a user (own list)
  fastify.get<{ Querystring: { user_id: string; limit?: string } }>('/conversions', async (request, reply) => {
    const { user_id, limit = '50' } = request.query;
    const take = Math.min(Number.parseInt(limit, 10) || 50, 100);
    const items = await listConversionsByUser(user_id, take);
    return reply.send({ user_id, items });
  });
}
