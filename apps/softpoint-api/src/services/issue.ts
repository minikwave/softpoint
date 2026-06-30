import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { bigintToDecimal } from './account.js';
import { appendLedgerEntry } from './ledger.js';
import { createReceipt, transitionReceipt } from './receipt.js';

export interface IssueParams {
  userId: string;
  amount: bigint;
  reason: string;
  expiresAt?: string;
  orderId?: string;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface IssueResult {
  accountId: string;
  userId: string;
  amount: string;
  txId: string;
  receiptId: string;
}

type TxClient = Prisma.TransactionClient;

async function ensureAccount(tx: TxClient, userId: string) {
  let account = await tx.paypointAccount.findUnique({ where: { userId } });
  if (!account) {
    account = await tx.paypointAccount.create({
      data: { userId, balance: 0, reservedBalance: 0, status: 'ACTIVE' },
    });
  }
  return account;
}

export async function issueCreditInTransaction(
  tx: TxClient,
  params: IssueParams
): Promise<IssueResult> {
  const { userId, amount, reason, expiresAt, orderId, metadata, idempotencyKey } = params;
  if (amount <= 0n) throw new Error('INVALID_AMOUNT');

  const account = await ensureAccount(tx, userId);
  const entryType = reason === 'PAYMENT_EARN' ? 'EARN' : 'ISSUE';
  const source = (metadata?.source as string) ?? reason;

  const receipt = await createReceipt(tx, {
    userId,
    intentType: entryType,
    amount,
    metadata: { reason, order_id: orderId, ...metadata },
  });

  await appendLedgerEntry(tx, {
    accountId: account.id,
    userId,
    entryType,
    amount,
    receiptId: receipt.id,
    sourceType: 'issue',
    sourceId: orderId,
    idempotencyKey: idempotencyKey ?? (orderId ? `ledger:issue:${orderId}` : undefined),
    metadata: { reason, source },
  });

  const meta: Record<string, unknown> = {
    reason,
    source,
    ...(expiresAt ? { expires_at: expiresAt } : {}),
    ...metadata,
  };

  const txRecord = await tx.paypointTransaction.create({
    data: {
      accountId: account.id,
      type: 'ISSUE',
      amount: bigintToDecimal(amount),
      orderId: orderId ?? null,
      receiptId: receipt.id,
      metadata: meta as object,
    },
  });

  await transitionReceipt(tx, receipt.id, 'COMPLETED', 'COMPLETED', {
    tx_id: txRecord.id,
  });

  return {
    accountId: account.id,
    userId: account.userId,
    amount: amount.toString(),
    txId: txRecord.id,
    receiptId: receipt.id,
  };
}

export async function issueCredit(params: IssueParams): Promise<IssueResult> {
  return prisma.$transaction((tx) => issueCreditInTransaction(tx, params));
}
