import type { PaypointPolicy } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export type PolicyWorkflowError = { code: 'NOT_FOUND' } | { code: 'INVALID_STATE'; current: string };

export type PolicyTransitionResult =
  | { policy: PaypointPolicy }
  | { error: PolicyWorkflowError };

function norm(s: string): string {
  return s.trim();
}

/**
 * 새 정책 초안 (복합 키 policy_id + version).
 */
export async function createPolicyDraft(input: {
  policyId: string;
  version: string;
  policyJson: object;
}) {
  const policyId = norm(input.policyId);
  const version = norm(input.version);
  if (!policyId || !version) throw new Error('INVALID_POLICY_KEY');
  return prisma.paypointPolicy.create({
    data: {
      policyId,
      version,
      policyJson: input.policyJson,
      status: 'DRAFT',
      effectiveFrom: null,
    },
  });
}

export async function submitPolicy(policyId: string, version: string): Promise<PolicyTransitionResult> {
  const pid = norm(policyId);
  const ver = norm(version);
  const row = await prisma.paypointPolicy.findUnique({
    where: { policyId_version: { policyId: pid, version: ver } },
  });
  if (!row) return { error: { code: 'NOT_FOUND' as const } };
  if (row.status !== 'DRAFT') return { error: { code: 'INVALID_STATE' as const, current: row.status } };
  const policy = await prisma.paypointPolicy.update({
    where: { policyId_version: { policyId: pid, version: ver } },
    data: { status: 'SUBMITTED' },
  });
  return { policy };
}

export async function approvePolicy(policyId: string, version: string): Promise<PolicyTransitionResult> {
  const pid = norm(policyId);
  const ver = norm(version);
  const row = await prisma.paypointPolicy.findUnique({
    where: { policyId_version: { policyId: pid, version: ver } },
  });
  if (!row) return { error: { code: 'NOT_FOUND' as const } };
  if (row.status !== 'SUBMITTED') return { error: { code: 'INVALID_STATE' as const, current: row.status } };
  const policy = await prisma.paypointPolicy.update({
    where: { policyId_version: { policyId: pid, version: ver } },
    data: { status: 'APPROVED' },
  });
  return { policy };
}

/**
 * 승인된 버전을 활성화. 동일 policy_id의 다른 ACTIVE 행은 SUPERSEDED.
 */
export async function activatePolicy(
  policyId: string,
  version: string,
  effectiveFrom?: Date
): Promise<PolicyTransitionResult> {
  const pid = norm(policyId);
  const ver = norm(version);
  const row = await prisma.paypointPolicy.findUnique({
    where: { policyId_version: { policyId: pid, version: ver } },
  });
  if (!row) return { error: { code: 'NOT_FOUND' as const } };
  if (row.status !== 'APPROVED') return { error: { code: 'INVALID_STATE' as const, current: row.status } };
  const eff = effectiveFrom ?? new Date();

  const policy = await prisma.$transaction(async (tx) => {
    await tx.paypointPolicy.updateMany({
      where: { policyId: pid, status: 'ACTIVE', version: { not: ver } },
      data: { status: 'SUPERSEDED' },
    });
    return tx.paypointPolicy.update({
      where: { policyId_version: { policyId: pid, version: ver } },
      data: { status: 'ACTIVE', effectiveFrom: eff },
    });
  });
  return { policy };
}

export async function listPolicies(opts: { policyId?: string; status?: string; limit: number }) {
  const take = Math.min(Math.max(opts.limit, 1), 200);
  const where: { policyId?: string; status?: string } = {};
  if (opts.policyId?.trim()) where.policyId = opts.policyId.trim();
  if (opts.status?.trim()) where.status = opts.status.trim();

  return prisma.paypointPolicy.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { updatedAt: 'desc' },
    take,
  });
}
