import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { getRequiredAdminApiKey, extractAdminApiKey } from '../lib/adminAuth.js';
import { getIdempotentResponse, setIdempotentResponse } from '../services/idempotency.js';
import { getAccountByUserId } from '../services/account.js';
import { decimalToBigint } from '../services/account.js';
import { issueCredit } from '../services/issue.js';
import { writeAuditLog, listAuditLogs } from '../services/audit.js';
import {
  authorizeConversion,
  settleConversion,
  failConversion,
} from '../services/conversion.js';

function toHttpError(err: unknown): { statusCode: number; code: string; message: string } {
  const msg = err instanceof Error ? err.message : 'INTERNAL_ERROR';
  if (msg === 'INSUFFICIENT_BALANCE') return { statusCode: 402, code: msg, message: msg };
  if (msg === 'CONVERSION_NOT_FOUND') return { statusCode: 404, code: msg, message: msg };
  if (msg === 'INVALID_AMOUNT' || msg.startsWith('INVALID_') || msg === 'CONVERSION_INVALID_STATUS') return { statusCode: 400, code: msg, message: msg };
  return { statusCode: 500, code: 'INTERNAL_ERROR', message: 'Internal server error' };
}

export async function adminRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  const adminKey = getRequiredAdminApiKey();
  if (adminKey) {
    fastify.addHook('onRequest', async (request, reply) => {
      const provided = extractAdminApiKey(request.headers);
      if (provided !== adminKey) {
        return reply.status(401).send({
          error: { code: 'UNAUTHORIZED', message: 'Invalid or missing admin API key' },
        });
      }
    });
  }

  // GET /v1/admin/audit-logs — append-only audit trail (newest first, cursor pagination)
  fastify.get<{
    Querystring: {
      actor_id?: string;
      action?: string;
      target_type?: string;
      limit?: string;
      cursor?: string;
    };
  }>('/audit-logs', async (request, reply) => {
    const { actor_id, action, target_type, limit = '50', cursor } = request.query;
    const take = Math.min(Number.parseInt(limit, 10) || 50, 200);
    const { rows, nextCursor } = await listAuditLogs({
      actorId: actor_id,
      action,
      targetType: target_type,
      limit: take,
      cursor,
    });

    return reply.send({
      items: rows.map((r) => ({
        id: r.id,
        actor_id: r.actorId,
        actor_role: r.actorRole,
        action: r.action,
        target_type: r.targetType,
        target_id: r.targetId,
        before: r.before ?? undefined,
        after: r.after ?? undefined,
        request_id: r.requestId ?? undefined,
        created_at: r.createdAt.toISOString(),
      })),
      next_cursor: nextCursor,
    });
  });

  // GET /v1/admin/users — search accounts by user_id (prefix match) or list with limit
  fastify.get<{
    Querystring: { user_id?: string; status?: string; limit?: string };
  }>('/users', async (request, reply) => {
    const { user_id, status, limit = '50' } = request.query;
    const take = Math.min(Number.parseInt(limit, 10) || 50, 200);
    const where: { userId?: { contains: string; mode: 'insensitive' }; status?: string } = {};
    if (user_id && user_id.trim()) where.userId = { contains: user_id.trim(), mode: 'insensitive' };
    if (status && status.trim()) where.status = status.trim();

    const accounts = await prisma.paypointAccount.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy: { updatedAt: 'desc' },
      take,
      select: {
        id: true,
        userId: true,
        balance: true,
        reservedBalance: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return reply.send({
      items: accounts.map((a: { id: string; userId: string; balance: { toString(): string }; reservedBalance: { toString(): string }; status: string; createdAt: Date; updatedAt: Date }) => ({
        account_id: a.id,
        user_id: a.userId,
        balance: a.balance.toString(),
        reserved_balance: a.reservedBalance.toString(),
        status: a.status,
        created_at: a.createdAt.toISOString(),
        updated_at: a.updatedAt.toISOString(),
      })),
      count: accounts.length,
    });
  });

  // GET /v1/admin/accounts/:userId — account detail + recent transactions (timeline)
  fastify.get<{ Params: { userId: string } }>('/accounts/:userId', async (request, reply) => {
    const { userId } = request.params;
    const account = await getAccountByUserId(userId);
    if (!account) {
      return reply.status(404).send({
        error: { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found' },
      });
    }

    const transactions = await prisma.paypointTransaction.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const balance = decimalToBigint(account.balance);
    const reserved = decimalToBigint(account.reservedBalance);

    return reply.send({
      account_id: account.id,
      user_id: account.userId,
      balance: balance.toString(),
      reserved_balance: reserved.toString(),
      available: (balance - reserved).toString(),
      status: account.status,
      created_at: account.createdAt.toISOString(),
      updated_at: account.updatedAt.toISOString(),
      timeline: transactions.map((t: { id: string; type: string; amount: unknown; orderId: string | null; receiptId: string | null; metadata: unknown; createdAt: Date }) => ({
        tx_id: t.id,
        type: t.type,
        amount: typeof t.amount === 'object' && t.amount !== null && 'toString' in t.amount ? (t.amount as { toString(): string }).toString() : String(t.amount),
        order_id: t.orderId ?? undefined,
        receipt_id: t.receiptId ?? undefined,
        metadata: t.metadata ?? undefined,
        created_at: t.createdAt.toISOString(),
      })),
    });
  });

  // POST /v1/admin/credits/issue — manual issue + audit log
  fastify.post<{
    Body: {
      user_id: string;
      amount: string;
      reason: string;
      expires_at?: string;
      actor_id?: string;
      actor_role?: string;
      idempotency_key?: string;
    };
  }>('/credits/issue', async (request, reply) => {
    const body = request.body;
    const amount = BigInt(body.amount);
    if (amount <= 0n) {
      return reply.status(400).send({
        error: { code: 'INVALID_AMOUNT', message: 'Amount must be positive' },
      });
    }

    const actorId = body.actor_id ?? 'system';
    const actorRole = body.actor_role ?? 'Ops Admin';

    const idempotencyKey = body.idempotency_key?.trim();
    if (idempotencyKey) {
      const stored = await getIdempotentResponse(idempotencyKey);
      if (stored) {
        return reply.status(200).send(stored);
      }
    }

    try {
      const result = await issueCredit({
        userId: body.user_id,
        amount,
        reason: body.reason,
        expiresAt: body.expires_at,
      });

      if (idempotencyKey) {
        await setIdempotentResponse(idempotencyKey, result as object);
      }

      await writeAuditLog({
        actorId,
        actorRole,
        action: 'CREDITS_ISSUE',
        targetType: 'account',
        targetId: result.accountId,
        after: {
          user_id: result.userId,
          amount: result.amount,
          reason: body.reason,
          tx_id: result.txId,
        },
        requestId: request.id,
      });

      return reply.status(201).send(result);
    } catch (err) {
      const e = toHttpError(err);
      return reply.status(e.statusCode).send({ error: { code: e.code, message: e.message } });
    }
  });

  // GET /v1/admin/conversions — list by status
  fastify.get<{
    Querystring: { status?: string; user_id?: string; limit?: string };
  }>('/conversions', async (request, reply) => {
    const { status, user_id, limit = '50' } = request.query;
    const take = Math.min(Number.parseInt(limit, 10) || 50, 200);
    const where: { status?: string; userId?: string } = {};
    if (status?.trim()) where.status = status.trim();
    if (user_id?.trim()) where.userId = user_id.trim();

    const list = await prisma.paypointConversion.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy: { createdAt: 'desc' },
      take,
    });

    return reply.send({
      items: list.map((c: { id: string; userId: string; type: string; fromAmount: { toString(): string }; toAsset: string; status: string; txHash: string | null; settlementRef: string | null; createdAt: Date; updatedAt: Date }) => ({
        id: c.id,
        user_id: c.userId,
        type: c.type,
        from_amount: c.fromAmount.toString(),
        to_asset: c.toAsset,
        status: c.status,
        tx_hash: c.txHash ?? undefined,
        settlement_ref: c.settlementRef ?? undefined,
        created_at: c.createdAt.toISOString(),
        updated_at: c.updatedAt.toISOString(),
      })),
      count: list.length,
    });
  });

  // POST /v1/admin/conversions/:id/approve — authorize (lock credits)
  fastify.post<{
    Params: { id: string };
    Body?: { actor_id?: string; actor_role?: string };
  }>('/conversions/:id/approve', async (request, reply) => {
    const body = request.body ?? {};
    const actorId = body.actor_id ?? 'system';
    const actorRole = body.actor_role ?? 'Ops Admin';
    try {
      const result = await authorizeConversion(request.params.id);
      await writeAuditLog({
        actorId,
        actorRole,
        action: 'CONVERSION_APPROVE',
        targetType: 'conversion',
        targetId: result.id,
        after: {
          userId: result.userId,
          status: result.status,
          fromAmount: result.fromAmount,
          type: result.type,
        },
        requestId: request.id,
      });
      return reply.status(200).send(result);
    } catch (err) {
      const e = toHttpError(err);
      return reply.status(e.statusCode).send({ error: { code: e.code, message: e.message } });
    }
  });

  // POST /v1/admin/conversions/:id/settle — settle (consume locked credits, optional tx_hash)
  fastify.post<{
    Params: { id: string };
    Body?: { tx_hash?: string; settlement_ref?: string; actor_id?: string; actor_role?: string };
  }>('/conversions/:id/settle', async (request, reply) => {
    const body = request.body ?? {};
    const actorId = body.actor_id ?? 'system';
    const actorRole = body.actor_role ?? 'Ops Admin';
    try {
      const result = await settleConversion(request.params.id, {
        txHash: body.tx_hash,
        settlementRef: body.settlement_ref,
      });
      await writeAuditLog({
        actorId,
        actorRole,
        action: 'CONVERSION_SETTLE',
        targetType: 'conversion',
        targetId: result.id,
        after: {
          userId: result.userId,
          status: result.status,
          fromAmount: result.fromAmount,
          txHash: result.txHash,
          settlementRef: result.settlementRef,
        },
        requestId: request.id,
      });
      return reply.status(200).send(result);
    } catch (err) {
      const e = toHttpError(err);
      return reply.status(e.statusCode).send({ error: { code: e.code, message: e.message } });
    }
  });

  // POST /v1/admin/conversions/:id/fail — fail (unlock credits)
  fastify.post<{
    Params: { id: string };
    Body?: { actor_id?: string; actor_role?: string };
  }>('/conversions/:id/fail', async (request, reply) => {
    const body = request.body ?? {};
    const actorId = body.actor_id ?? 'system';
    const actorRole = body.actor_role ?? 'Ops Admin';
    try {
      const result = await failConversion(request.params.id);
      await writeAuditLog({
        actorId,
        actorRole,
        action: 'CONVERSION_FAIL',
        targetType: 'conversion',
        targetId: result.id,
        after: {
          userId: result.userId,
          status: result.status,
          fromAmount: result.fromAmount,
        },
        requestId: request.id,
      });
      return reply.status(200).send(result);
    } catch (err) {
      const e = toHttpError(err);
      return reply.status(e.statusCode).send({ error: { code: e.code, message: e.message } });
    }
  });
}
