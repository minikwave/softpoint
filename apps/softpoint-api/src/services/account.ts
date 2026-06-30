import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma.js';

export function decimalToBigint(d: Decimal): bigint {
  return BigInt(d.toString());
}

export function bigintToDecimal(n: bigint): Decimal {
  return new Decimal(n.toString());
}

/**
 * Get account by user_id. Returns null if not found.
 */
export async function getAccountByUserId(userId: string) {
  return prisma.paypointAccount.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      balance: true,
      reservedBalance: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Get or create account for user. Used by issue flow.
 */
export async function getOrCreateAccount(userId: string) {
  let account = await prisma.paypointAccount.findUnique({ where: { userId } });
  if (!account) {
    account = await prisma.paypointAccount.create({
      data: {
        userId,
        balance: 0,
        reservedBalance: 0,
        status: 'ACTIVE',
      },
    });
  }
  return account;
}
