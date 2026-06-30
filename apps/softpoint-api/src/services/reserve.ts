import { prisma } from '../lib/prisma.js';

export async function getReserveSummary() {
  const agg = await prisma.paypointAccount.aggregate({
    _sum: { balance: true, reservedBalance: true },
    _count: { id: true },
  });

  const issueSum = await prisma.paypointTransaction.aggregate({
    where: { type: 'ISSUE' },
    _sum: { amount: true },
  });

  const spendSum = await prisma.paypointTransaction.aggregate({
    where: { type: 'SPEND' },
    _sum: { amount: true },
  });

  const redemptionCount = await prisma.creditRedemption.count({
    where: { status: 'FULFILLED' },
  });

  const openExceptions = await prisma.paypointException.count({
    where: { status: 'OPEN' },
  });

  return {
    total_balance: agg._sum.balance?.toString() ?? '0',
    total_reserved: agg._sum.reservedBalance?.toString() ?? '0',
    account_count: agg._count.id,
    total_issued: issueSum._sum.amount?.toString() ?? '0',
    total_spent: spendSum._sum.amount?.toString() ?? '0',
    redemption_fulfilled_count: redemptionCount,
    open_exceptions: openExceptions,
    as_of: new Date().toISOString(),
  };
}
