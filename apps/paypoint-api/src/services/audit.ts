import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface AuditParams {
  actorId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  before?: object;
  after?: object;
  requestId?: string;
}

/**
 * Append-only audit log for admin actions (doc 15).
 */
export async function writeAuditLog(params: AuditParams): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      before: params.before as object | undefined,
      after: params.after as object | undefined,
      requestId: params.requestId ?? undefined,
    },
  });
}

export interface ListAuditLogsOpts {
  actorId?: string;
  action?: string;
  targetType?: string;
  limit: number;
  cursor?: string;
}

/**
 * Newest first; cursor is audit log id for pagination.
 */
export async function listAuditLogs(
  opts: ListAuditLogsOpts
): Promise<{ rows: import('@prisma/client').AuditLog[]; nextCursor: string | null }> {
  const take = Math.min(Math.max(opts.limit, 1), 200);
  const where: Prisma.AuditLogWhereInput = {};
  if (opts.actorId?.trim()) {
    where.actorId = { contains: opts.actorId.trim(), mode: 'insensitive' };
  }
  if (opts.action?.trim()) {
    where.action = { contains: opts.action.trim(), mode: 'insensitive' };
  }
  if (opts.targetType?.trim()) {
    where.targetType = { contains: opts.targetType.trim(), mode: 'insensitive' };
  }

  const list = await prisma.auditLog.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { createdAt: 'desc' },
    take: take + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  });

  const hasMore = list.length > take;
  const rows = hasMore ? list.slice(0, take) : list;
  const nextCursor = hasMore ? rows[rows.length - 1]?.id ?? null : null;

  return { rows, nextCursor };
}
