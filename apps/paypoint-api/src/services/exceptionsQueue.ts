import type { PaypointException } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export async function listExceptions(opts: {
  status?: string;
  userId?: string;
  limit: number;
}): Promise<PaypointException[]> {
  const take = Math.min(Math.max(opts.limit, 1), 200);
  const where: { status?: string; userId?: string } = {};
  if (opts.status?.trim()) where.status = opts.status.trim();
  if (opts.userId?.trim()) where.userId = opts.userId.trim();

  return prisma.paypointException.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { createdAt: 'desc' },
    take,
  });
}

export async function enqueueException(input: {
  referenceType: string;
  referenceId: string;
  title: string;
  userId?: string;
  detail?: object;
}): Promise<PaypointException> {
  const referenceType = input.referenceType.trim();
  const referenceId = input.referenceId.trim();
  const title = input.title.trim();
  if (!referenceType || !referenceId || !title) {
    throw new Error('INVALID_EXCEPTION_BODY');
  }
  return prisma.paypointException.create({
    data: {
      referenceType,
      referenceId,
      userId: input.userId?.trim() || null,
      title,
      detail: input.detail ?? undefined,
      status: 'OPEN',
    },
  });
}

export type ResolveDisposition = 'RESOLVED' | 'DISMISSED';

export async function resolveException(
  id: string,
  input: {
    disposition: ResolveDisposition;
    resolutionNote?: string;
    resolvedBy: string;
  }
): Promise<PaypointException> {
  const row = await prisma.paypointException.findUnique({ where: { id } });
  if (!row) throw new Error('EXCEPTION_NOT_FOUND');
  if (row.status !== 'OPEN') throw new Error('EXCEPTION_INVALID_STATUS');
  const note = input.resolutionNote?.trim() || null;
  return prisma.paypointException.update({
    where: { id },
    data: {
      status: input.disposition,
      resolutionNote: note,
      resolvedAt: new Date(),
      resolvedBy: input.resolvedBy.trim() || 'system',
    },
  });
}
