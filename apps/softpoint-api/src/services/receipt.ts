import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { bigintToDecimal } from './account.js';

export interface ReceiptRecord {
  id: string;
  userId: string;
  merchantId?: string;
  intentType: string;
  status: string;
  amount: string;
  assetType: string;
  policyDecision?: unknown;
  metadata?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptEventRecord {
  id: string;
  type: string;
  payload?: unknown;
  createdAt: string;
}

function toReceiptRecord(r: {
  id: string;
  userId: string;
  merchantId: string | null;
  intentType: string;
  status: string;
  amount: { toString(): string };
  assetType: string;
  policyDecision: unknown;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): ReceiptRecord {
  return {
    id: r.id,
    userId: r.userId,
    merchantId: r.merchantId ?? undefined,
    intentType: r.intentType,
    status: r.status,
    amount: r.amount.toString(),
    assetType: r.assetType,
    policyDecision: r.policyDecision ?? undefined,
    metadata: r.metadata ?? undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function createReceipt(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    intentType: string;
    amount: bigint;
    merchantId?: string;
    agentId?: string;
    metadata?: Record<string, unknown>;
    policyDecision?: Record<string, unknown>;
  }
): Promise<ReceiptRecord> {
  const receipt = await tx.receipt.create({
    data: {
      userId: input.userId,
      intentType: input.intentType,
      status: 'CREATED',
      amount: bigintToDecimal(input.amount),
      merchantId: input.merchantId ?? null,
      agentId: input.agentId ?? null,
      metadata: input.metadata ? (input.metadata as object) : undefined,
      policyDecision: input.policyDecision ? (input.policyDecision as object) : undefined,
    },
  });

  await tx.receiptEvent.create({
    data: {
      receiptId: receipt.id,
      type: 'CREATED',
      payload: { intentType: input.intentType, amount: input.amount.toString() } as object,
    },
  });

  return toReceiptRecord(receipt);
}

export async function transitionReceipt(
  tx: Prisma.TransactionClient,
  receiptId: string,
  status: string,
  eventType: string,
  payload?: Record<string, unknown>
): Promise<ReceiptRecord> {
  const receipt = await tx.receipt.update({
    where: { id: receiptId },
    data: { status },
  });
  await tx.receiptEvent.create({
    data: {
      receiptId,
      type: eventType,
      payload: payload ? (payload as object) : undefined,
    },
  });
  return toReceiptRecord(receipt);
}

export async function getReceiptById(id: string): Promise<ReceiptRecord | null> {
  const r = await prisma.receipt.findUnique({ where: { id } });
  return r ? toReceiptRecord(r) : null;
}

export async function listReceiptEvents(receiptId: string): Promise<ReceiptEventRecord[]> {
  const events = await prisma.receiptEvent.findMany({
    where: { receiptId },
    orderBy: { createdAt: 'asc' },
  });
  return events.map((e) => ({
    id: e.id,
    type: e.type,
    payload: e.payload ?? undefined,
    createdAt: e.createdAt.toISOString(),
  }));
}

export async function listReceiptsForUser(userId: string, limit = 50): Promise<ReceiptRecord[]> {
  const rows = await prisma.receipt.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 100),
  });
  return rows.map(toReceiptRecord);
}

export async function listReceiptsAdmin(opts: {
  status?: string;
  userId?: string;
  intentType?: string;
  limit: number;
}) {
  const where: { status?: string; userId?: string; intentType?: string } = {};
  if (opts.status?.trim()) where.status = opts.status.trim();
  if (opts.userId?.trim()) where.userId = opts.userId.trim();
  if (opts.intentType?.trim()) where.intentType = opts.intentType.trim();

  const rows = await prisma.receipt.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { createdAt: 'desc' },
    take: Math.min(opts.limit, 200),
  });
  return rows.map(toReceiptRecord);
}
