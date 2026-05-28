import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { getAccountByUserId } from '../services/account.js';
import { decimalToBigint } from '../services/account.js';
import { issueCredit } from '../services/issue.js';
import { writeAuditLog, listAuditLogs } from '../services/audit.js';
import {
  authorizeConversion,
  settleConversion,
  failConversion,
} from '../services/conversion.js';
import {
  createPolicyDraft,
  submitPolicy,
  approvePolicy,
  activatePolicy,
  listPolicies,
} from '../services/policyWorkflow.js';
import {
  listExceptions,
  enqueueException,
  resolveException,
} from '../services/exceptionsQueue.js';
import { listReceiptsAdmin } from '../services/receipt.js';
import { getReserveSummary } from '../services/reserve.js';

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

    try {
      const result = await issueCredit({
        userId: body.user_id,
        amount,
        reason: body.reason,
        expiresAt: body.expires_at,
      });

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
  fastify.post<{ Params: { id: string } }>('/conversions/:id/approve', async (request, reply) => {
    try {
      const result = await authorizeConversion(request.params.id);
      return reply.status(200).send(result);
    } catch (err) {
      const e = toHttpError(err);
      return reply.status(e.statusCode).send({ error: { code: e.code, message: e.message } });
    }
  });

  // POST /v1/admin/conversions/:id/settle — settle (consume locked credits, optional tx_hash)
  fastify.post<{
    Params: { id: string };
    Body: { tx_hash?: string; settlement_ref?: string };
  }>('/conversions/:id/settle', async (request, reply) => {
    try {
      const result = await settleConversion(request.params.id, {
        txHash: request.body?.tx_hash,
        settlementRef: request.body?.settlement_ref,
      });
      return reply.status(200).send(result);
    } catch (err) {
      const e = toHttpError(err);
      return reply.status(e.statusCode).send({ error: { code: e.code, message: e.message } });
    }
  });

  // POST /v1/admin/conversions/:id/fail — fail (unlock credits)
  fastify.post<{ Params: { id: string } }>('/conversions/:id/fail', async (request, reply) => {
    try {
      const result = await failConversion(request.params.id);
      return reply.status(200).send(result);
    } catch (err) {
      const e = toHttpError(err);
      return reply.status(e.statusCode).send({ error: { code: e.code, message: e.message } });
    }
  });

  // GET /v1/admin/dashboard
  fastify.get('/dashboard', async (_request, reply) => {
    const reserve = await getReserveSummary();
    const pendingConversions = await prisma.paypointConversion.count({
      where: { status: { in: ['REQUESTED', 'AUTHORIZED', 'EXECUTING'] } },
    });
    return reply.send({
      ...reserve,
      pending_conversions: pendingConversions,
    });
  });

  // GET /v1/admin/reserve
  fastify.get('/reserve', async (_request, reply) => {
    return reply.send(await getReserveSummary());
  });

  // GET /v1/admin/receipts
  fastify.get<{
    Querystring: { status?: string; user_id?: string; intent_type?: string; limit?: string };
  }>('/receipts', async (request, reply) => {
    const limit = Math.min(Number.parseInt(request.query.limit ?? '50', 10) || 50, 200);
    const items = await listReceiptsAdmin({
      status: request.query.status,
      userId: request.query.user_id,
      intentType: request.query.intent_type,
      limit,
    });
    return reply.send({ items, count: items.length });
  });

  // GET /v1/admin/audit-logs
  fastify.get<{
    Querystring: {
      actor_id?: string;
      action?: string;
      target_type?: string;
      limit?: string;
      cursor?: string;
    };
  }>('/audit-logs', async (request, reply) => {
    const limit = Math.min(Number.parseInt(request.query.limit ?? '40', 10) || 40, 200);
    const { items, nextCursor } = await listAuditLogs({
      actorId: request.query.actor_id,
      action: request.query.action,
      targetType: request.query.target_type,
      limit,
      cursor: request.query.cursor,
    });
    return reply.send({
      items: items.map((row) => ({
        id: row.id,
        actor_id: row.actorId,
        actor_role: row.actorRole,
        action: row.action,
        target_type: row.targetType,
        target_id: row.targetId,
        before: row.before ?? undefined,
        after: row.after ?? undefined,
        request_id: row.requestId ?? undefined,
        created_at: row.createdAt.toISOString(),
      })),
      next_cursor: nextCursor,
    });
  });

  // GET /v1/admin/policies
  fastify.get<{ Querystring: { policy_id?: string; status?: string; limit?: string } }>(
    '/policies',
    async (request, reply) => {
      const limit = Math.min(Number.parseInt(request.query.limit ?? '50', 10) || 50, 200);
      const items = await listPolicies({
        policyId: request.query.policy_id,
        status: request.query.status,
        limit,
      });
      return reply.send({
        items: items.map((p) => ({
          policy_id: p.policyId,
          version: p.version,
          status: p.status,
          policy_json: p.policyJson,
          effective_from: p.effectiveFrom?.toISOString() ?? null,
          updated_at: p.updatedAt.toISOString(),
        })),
        count: items.length,
      });
    }
  );

  fastify.post<{ Body: { policy_id: string; version: string; policy_json: object } }>(
    '/policies/draft',
    async (request, reply) => {
      try {
        const policy = await createPolicyDraft({
          policyId: request.body.policy_id,
          version: request.body.version,
          policyJson: request.body.policy_json,
        });
        return reply.status(201).send({
          policy_id: policy.policyId,
          version: policy.version,
          status: policy.status,
        });
      } catch (err) {
        const e = toHttpError(err);
        return reply.status(e.statusCode).send({ error: { code: e.code, message: e.message } });
      }
    }
  );

  fastify.post<{ Params: { policyId: string; version: string } }>(
    '/policies/:policyId/:version/submit',
    async (request, reply) => {
      const result = await submitPolicy(request.params.policyId, request.params.version);
      if ('error' in result) {
        return reply.status(404).send({ error: result.error });
      }
      return reply.send({ policy_id: result.policy.policyId, version: result.policy.version, status: result.policy.status });
    }
  );

  fastify.post<{ Params: { policyId: string; version: string } }>(
    '/policies/:policyId/:version/approve',
    async (request, reply) => {
      const result = await approvePolicy(request.params.policyId, request.params.version);
      if ('error' in result) {
        return reply.status(404).send({ error: result.error });
      }
      return reply.send({ policy_id: result.policy.policyId, version: result.policy.version, status: result.policy.status });
    }
  );

  fastify.post<{ Params: { policyId: string; version: string } }>(
    '/policies/:policyId/:version/activate',
    async (request, reply) => {
      const result = await activatePolicy(request.params.policyId, request.params.version);
      if ('error' in result) {
        return reply.status(404).send({ error: result.error });
      }
      return reply.send({ policy_id: result.policy.policyId, version: result.policy.version, status: result.policy.status });
    }
  );

  fastify.get<{ Querystring: { status?: string; user_id?: string; limit?: string } }>(
    '/exceptions',
    async (request, reply) => {
      const limit = Math.min(Number.parseInt(request.query.limit ?? '50', 10) || 50, 200);
      const items = await listExceptions({
        status: request.query.status,
        userId: request.query.user_id,
        limit,
      });
      return reply.send({
        items: items.map((x) => ({
          id: x.id,
          reference_type: x.referenceType,
          reference_id: x.referenceId,
          user_id: x.userId,
          title: x.title,
          status: x.status,
          created_at: x.createdAt.toISOString(),
        })),
        count: items.length,
      });
    }
  );

  fastify.post<{
    Body: {
      reference_type: string;
      reference_id: string;
      title: string;
      user_id?: string;
      detail?: object;
    };
  }>('/exceptions', async (request, reply) => {
    try {
      const row = await enqueueException({
        referenceType: request.body.reference_type,
        referenceId: request.body.reference_id,
        title: request.body.title,
        userId: request.body.user_id,
        detail: request.body.detail,
      });
      return reply.status(201).send({ id: row.id, status: row.status });
    } catch (err) {
      const e = toHttpError(err);
      return reply.status(e.statusCode).send({ error: { code: e.code, message: e.message } });
    }
  });

  fastify.post<{
    Params: { id: string };
    Body: { disposition: 'RESOLVED' | 'DISMISSED'; resolution_note?: string; resolved_by?: string };
  }>('/exceptions/:id/resolve', async (request, reply) => {
    try {
      const row = await resolveException(request.params.id, {
        disposition: request.body.disposition,
        resolutionNote: request.body.resolution_note,
        resolvedBy: request.body.resolved_by ?? 'operator',
      });
      return reply.send({ id: row.id, status: row.status });
    } catch (err) {
      const e = toHttpError(err);
      return reply.status(e.statusCode).send({ error: { code: e.code, message: e.message } });
    }
  });
}
