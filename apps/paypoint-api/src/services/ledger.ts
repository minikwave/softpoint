import type { Prisma } from '@prisma/client';
import { Prisma as PrismaNs } from '@prisma/client';
import { bigintToDecimal } from './account.js';

const DEBIT_TYPES = new Set(['SPEND', 'REDEEM', 'LOCK', 'SETTLEMENT_DEBIT', 'EXPIRE']);

export function isDebitEntryType(entryType: string): boolean {
  return DEBIT_TYPES.has(entryType);
}

export interface AppendLedgerParams {
  accountId: string;
  userId: string;
  entryType: string;
  amount: bigint;
  receiptId?: string;
  sourceType?: string;
  sourceId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface AppendLedgerResult {
  ledgerEntryId: string;
  balanceBefore: string;
  balanceAfter: string;
}

/**
 * Row lock + ledger append + balance update (SSOT for balance changes).
 */
export async function appendLedgerEntry(
  tx: Prisma.TransactionClient,
  params: AppendLedgerParams
): Promise<AppendLedgerResult> {
  const { accountId, userId, entryType, amount, receiptId, sourceType, sourceId, idempotencyKey, metadata } =
    params;
  if (amount <= 0n) throw new Error('INVALID_AMOUNT');

  if (idempotencyKey) {
    const existing = await tx.ledgerEntry.findUnique({ where: { idempotencyKey } });
    if (existing) {
      return {
        ledgerEntryId: existing.id,
        balanceBefore: existing.balanceBefore.toString(),
        balanceAfter: existing.balanceAfter.toString(),
      };
    }
  }

  const locked = await tx.$queryRaw<{ balance: string }[]>(PrismaNs.sql`
    SELECT balance::text AS balance FROM paypoint_accounts WHERE id = ${accountId}::uuid FOR UPDATE
  `);
  if (!locked.length) throw new Error('ACCOUNT_NOT_FOUND');

  const balanceBefore = BigInt(locked[0]!.balance);
  const delta = isDebitEntryType(entryType) ? -amount : amount;
  const balanceAfter = balanceBefore + delta;
  if (balanceAfter < 0n) throw new Error('INSUFFICIENT_BALANCE');

  await tx.paypointAccount.update({
    where: { id: accountId },
    data: { balance: bigintToDecimal(balanceAfter) },
  });

  const entry = await tx.ledgerEntry.create({
    data: {
      accountId,
      userId,
      entryType,
      amount: bigintToDecimal(amount),
      balanceBefore: bigintToDecimal(balanceBefore),
      balanceAfter: bigintToDecimal(balanceAfter),
      receiptId: receiptId ?? null,
      sourceType: sourceType ?? null,
      sourceId: sourceId ?? null,
      idempotencyKey: idempotencyKey ?? null,
      metadata: metadata ? (metadata as object) : undefined,
    },
  });

  return {
    ledgerEntryId: entry.id,
    balanceBefore: balanceBefore.toString(),
    balanceAfter: balanceAfter.toString(),
  };
}
