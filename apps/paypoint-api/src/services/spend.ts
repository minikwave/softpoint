import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { canSpend } from '@paypoint/domain';
import { bigintToDecimal } from './account.js';
import { appendLedgerEntry } from './ledger.js';
import { createReceipt, transitionReceipt } from './receipt.js';
import { applyPaymentEarnInSpendTx, type PaymentEarnInfo } from './paymentEarn.js';

export interface SpendParams {
  userId: string;
  amount: bigint;
  orderId: string;
}

export interface SpendResult {
  txId: string;
  receiptId: string;
  userId: string;
  amount: string;
  orderId: string;
  paymentEarn?: PaymentEarnInfo | null;
}

export async function spendCredit(params: SpendParams): Promise<SpendResult> {
  const { userId, amount, orderId } = params;
  if (amount <= 0n) throw new Error('INVALID_AMOUNT');

  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<
      { id: string; balance: string; reserved_balance: string }[]
    >(Prisma.sql`
      SELECT id, balance::text AS balance, reserved_balance::text AS reserved_balance
      FROM paypoint_accounts
      WHERE user_id = ${userId}
      FOR UPDATE
    `);

    if (!locked.length) throw new Error('ACCOUNT_NOT_FOUND');

    const row = locked[0]!;
    const balance = BigInt(row.balance);
    const reservedBalance = BigInt(row.reserved_balance);

    if (!canSpend({ balance, reserved_balance: reservedBalance }, amount)) {
      throw new Error('INSUFFICIENT_BALANCE');
    }

    const receipt = await createReceipt(tx, {
      userId,
      intentType: 'SPEND',
      amount,
      metadata: { order_id: orderId },
    });

    await appendLedgerEntry(tx, {
      accountId: row.id,
      userId,
      entryType: 'SPEND',
      amount,
      receiptId: receipt.id,
      sourceType: 'spend',
      sourceId: orderId,
      idempotencyKey: `ledger:spend:${userId}:${orderId}`,
    });

    const txRecord = await tx.paypointTransaction.create({
      data: {
        accountId: row.id,
        type: 'SPEND',
        amount: bigintToDecimal(amount),
        orderId,
        receiptId: receipt.id,
      },
    });

    await transitionReceipt(tx, receipt.id, 'COMPLETED', 'COMPLETED', {
      tx_id: txRecord.id,
      order_id: orderId,
    });

    const paymentEarn = await applyPaymentEarnInSpendTx(tx, {
      accountId: row.id,
      userId,
      spendAmount: amount,
      orderId,
      parentReceiptId: receipt.id,
    });

    return {
      txId: txRecord.id,
      receiptId: receipt.id,
      userId,
      amount: amount.toString(),
      orderId,
      paymentEarn,
    };
  });
}
