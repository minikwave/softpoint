import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { canSpend, calculatePaymentEarnAmount, PAYMENT_EARN_POLICY_ID } from '@paypoint/domain';
import { bigintToDecimal } from './account.js';

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
  /** 활성 PAYMENT_EARN_POLICY가 있고 적립액 > 0일 때만 */
  paymentEarn?: {
    amount: string;
    txId: string;
    policyId: string;
    policyVersion: string;
  };
}

/**
 * Spend credit: lock row (FOR UPDATE), check available balance, deduct, append transaction.
 * Atomic; prevents double spend.
 */
export async function spendCredit(params: SpendParams): Promise<SpendResult> {
  const { userId, amount, orderId } = params;
  if (amount <= 0n) throw new Error('INVALID_AMOUNT');

  const result = await prisma.$transaction(async (tx) => {
    // Lock account row (SELECT FOR UPDATE) so concurrent spends serialize
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

    const newBalance = balance - amount;

    await tx.$executeRaw(Prisma.sql`
      UPDATE paypoint_accounts
      SET balance = ${newBalance.toString()}::numeric(30,0), updated_at = now()
      WHERE id = ${row.id}::uuid
    `);

    const receiptId = `RCP-${Date.now()}-${row.id.slice(0, 8)}`;
    const txRecord = await tx.paypointTransaction.create({
      data: {
        accountId: row.id,
        type: 'SPEND',
        amount: bigintToDecimal(amount),
        orderId,
        receiptId,
      },
    });

    const policyRow = await tx.paypointPolicy.findFirst({
      where: { policyId: PAYMENT_EARN_POLICY_ID, status: 'ACTIVE' },
      orderBy: [{ effectiveFrom: 'desc' }, { updatedAt: 'desc' }],
    });

    let paymentEarn: SpendResult['paymentEarn'];
    if (policyRow) {
      const earn = calculatePaymentEarnAmount(amount, policyRow.policyJson);
      if (earn > 0n) {
        const balAfterEarn = newBalance + earn;
        await tx.$executeRaw(Prisma.sql`
          UPDATE paypoint_accounts
          SET balance = ${balAfterEarn.toString()}::numeric(30,0), updated_at = now()
          WHERE id = ${row.id}::uuid
        `);
        const earnRow = await tx.paypointTransaction.create({
          data: {
            accountId: row.id,
            type: 'ISSUE',
            amount: bigintToDecimal(earn),
            orderId,
            metadata: {
              reason: 'payment_earn',
              source: 'payment_earn',
              policy_id: policyRow.policyId,
              policy_version: policyRow.version,
              spend_tx_id: txRecord.id,
            } as object,
          },
        });
        paymentEarn = {
          amount: earn.toString(),
          txId: earnRow.id,
          policyId: policyRow.policyId,
          policyVersion: policyRow.version,
        };
      }
    }

    return {
      txId: txRecord.id,
      receiptId,
      userId,
      amount: amount.toString(),
      orderId,
      paymentEarn,
    };
  });

  return result;
}
