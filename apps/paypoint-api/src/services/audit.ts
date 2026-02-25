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
