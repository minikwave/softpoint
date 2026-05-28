import { prisma } from '../lib/prisma.js';
import { bigintToDecimal } from './account.js';

export interface IssueParams {
  userId: string;
  amount: bigint;
  reason: string;
  expiresAt?: string;
}

export interface IssueResult {
  accountId: string;
  userId: string;
  amount: string;
  txId: string;
}

/**
 * Issue credit: create account if needed, add balance, append transaction.
 * Atomic in one transaction.
 */
export async function issueCredit(params: IssueParams): Promise<IssueResult> {
  const { userId, amount, reason, expiresAt } = params;
  if (amount <= 0n) throw new Error('INVALID_AMOUNT');

  const result = await prisma.$transaction(async (tx) => {
    let account = await tx.paypointAccount.findUnique({ where: { userId } });
    if (!account) {
      account = await tx.paypointAccount.create({
        data: {
          userId,
          balance: 0,
          reservedBalance: 0,
          status: 'ACTIVE',
        },
      });
    }

    const newBalance = BigInt(account.balance.toString()) + amount;
    if (newBalance < 0n) throw new Error('INVALID_BALANCE');

    await tx.paypointAccount.update({
      where: { id: account.id },
      data: { balance: bigintToDecimal(newBalance) },
    });

    const txRecord = await tx.paypointTransaction.create({
      data: {
        accountId: account.id,
        type: 'ISSUE',
        amount: bigintToDecimal(amount),
        metadata: { reason, expires_at: expiresAt } as object,
      },
    });

    return {
      accountId: account.id,
      userId: account.userId,
      amount: amount.toString(),
      txId: txRecord.id,
    };
  });

  return result;
}
