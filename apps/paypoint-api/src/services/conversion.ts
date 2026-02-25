import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { canSpend } from '@paypoint/domain';
import { bigintToDecimal } from './account.js';

const VALID_TYPES = ['USER_CASHOUT', 'MERCHANT_SETTLEMENT', 'TREASURY'] as const;
const STATUS_REQUESTED = 'REQUESTED';
const STATUS_AUTHORIZED = 'AUTHORIZED';
const STATUS_EXECUTING = 'EXECUTING';
const STATUS_SETTLED = 'SETTLED';
const STATUS_FAILED = 'FAILED';

export interface RequestConversionParams {
  userId: string;
  type: string;
  fromAmount: bigint;
  toAsset: string;
  toChainId?: number;
}

export interface ConversionRecord {
  id: string;
  userId: string;
  type: string;
  fromAmount: string;
  fromUnit: string;
  toAsset: string;
  status: string;
  txHash?: string;
  settlementRef?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create conversion request (status = REQUESTED).
 * MVP: MERCHANT_SETTLEMENT only or all types; policy can restrict later.
 */
export async function requestConversion(params: RequestConversionParams): Promise<ConversionRecord> {
  const { userId, type, fromAmount, toAsset, toChainId } = params;
  if (fromAmount <= 0n) throw new Error('INVALID_AMOUNT');
  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    throw new Error('INVALID_CONVERSION_TYPE');
  }

  const conversion = await prisma.paypointConversion.create({
    data: {
      userId,
      type,
      fromAmount: bigintToDecimal(fromAmount),
      fromUnit: 'PAYPOINT',
      toAsset,
      toChainId: toChainId != null ? BigInt(toChainId) : null,
      status: STATUS_REQUESTED,
    },
  });

  return toConversionRecord(conversion);
}

/**
 * Authorize conversion: lock credits (reserved_balance += from_amount).
 * Requires REQUESTED and sufficient available balance.
 */
export async function authorizeConversion(conversionId: string): Promise<ConversionRecord> {
  const result = await prisma.$transaction(async (tx) => {
    const conv = await tx.paypointConversion.findUnique({
      where: { id: conversionId },
    });
    if (!conv) throw new Error('CONVERSION_NOT_FOUND');
    if (conv.status !== STATUS_REQUESTED) throw new Error('CONVERSION_INVALID_STATUS');

    const amount = BigInt(conv.fromAmount.toString());

    const locked = await tx.$queryRaw<
      { id: string; balance: string; reserved_balance: string }[]
    >(Prisma.sql`
      SELECT id, balance::text AS balance, reserved_balance::text AS reserved_balance
      FROM paypoint_accounts
      WHERE user_id = ${conv.userId}
      FOR UPDATE
    `);
    if (!locked.length) throw new Error('ACCOUNT_NOT_FOUND');

    const row = locked[0]!;
    const balance = BigInt(row.balance);
    const reservedBalance = BigInt(row.reserved_balance);
    if (!canSpend({ balance, reserved_balance: reservedBalance }, amount)) {
      throw new Error('INSUFFICIENT_BALANCE');
    }

    const newReserved = reservedBalance + amount;
    await tx.$executeRaw(Prisma.sql`
      UPDATE paypoint_accounts
      SET reserved_balance = ${newReserved.toString()}::numeric(30,0), updated_at = now()
      WHERE id = ${row.id}::uuid
    `);

    const updated = await tx.paypointConversion.update({
      where: { id: conversionId },
      data: { status: STATUS_AUTHORIZED },
    });
    return updated;
  });

  return toConversionRecord(result);
}

/**
 * Settle conversion: consume locked credits (balance -= amount, reserved_balance -= amount).
 */
export async function settleConversion(
  conversionId: string,
  opts?: { txHash?: string; settlementRef?: string }
): Promise<ConversionRecord> {
  const result = await prisma.$transaction(async (tx) => {
    const conv = await tx.paypointConversion.findUnique({
      where: { id: conversionId },
    });
    if (!conv) throw new Error('CONVERSION_NOT_FOUND');
    if (conv.status !== STATUS_AUTHORIZED && conv.status !== STATUS_EXECUTING) {
      throw new Error('CONVERSION_INVALID_STATUS');
    }

    const amount = BigInt(conv.fromAmount.toString());

    const locked = await tx.$queryRaw<
      { id: string; balance: string; reserved_balance: string }[]
    >(Prisma.sql`
      SELECT id, balance::text AS balance, reserved_balance::text AS reserved_balance
      FROM paypoint_accounts
      WHERE user_id = ${conv.userId}
      FOR UPDATE
    `);
    if (!locked.length) throw new Error('ACCOUNT_NOT_FOUND');

    const row = locked[0]!;
    const balance = BigInt(row.balance);
    const reservedBalance = BigInt(row.reserved_balance);
    if (reservedBalance < amount) throw new Error('INVALID_RESERVED');

    const newBalance = balance - amount;
    const newReserved = reservedBalance - amount;
    await tx.$executeRaw(Prisma.sql`
      UPDATE paypoint_accounts
      SET balance = ${newBalance.toString()}::numeric(30,0),
          reserved_balance = ${newReserved.toString()}::numeric(30,0),
          updated_at = now()
      WHERE id = ${row.id}::uuid
    `);

    const updated = await tx.paypointConversion.update({
      where: { id: conversionId },
      data: {
        status: STATUS_SETTLED,
        txHash: opts?.txHash ?? undefined,
        settlementRef: opts?.settlementRef ?? undefined,
      },
    });
    return updated;
  });

  return toConversionRecord(result);
}

/**
 * Fail conversion: if AUTHORIZED/EXECUTING unlock credits (reserved_balance -= amount);
 * if REQUESTED just set status to FAILED (no account change).
 */
export async function failConversion(conversionId: string): Promise<ConversionRecord> {
  const result = await prisma.$transaction(async (tx) => {
    const conv = await tx.paypointConversion.findUnique({
      where: { id: conversionId },
    });
    if (!conv) throw new Error('CONVERSION_NOT_FOUND');
    if (conv.status !== STATUS_REQUESTED && conv.status !== STATUS_AUTHORIZED && conv.status !== STATUS_EXECUTING) {
      throw new Error('CONVERSION_INVALID_STATUS');
    }

    if (conv.status === STATUS_AUTHORIZED || conv.status === STATUS_EXECUTING) {
      const amount = BigInt(conv.fromAmount.toString());
      const locked = await tx.$queryRaw<
        { id: string; reserved_balance: string }[]
      >(Prisma.sql`
        SELECT id, reserved_balance::text AS reserved_balance
        FROM paypoint_accounts
        WHERE user_id = ${conv.userId}
        FOR UPDATE
      `);
      if (!locked.length) throw new Error('ACCOUNT_NOT_FOUND');
      const row = locked[0]!;
      const reservedBalance = BigInt(row.reserved_balance);
      const newReserved = reservedBalance >= amount ? reservedBalance - amount : 0n;
      await tx.$executeRaw(Prisma.sql`
        UPDATE paypoint_accounts
        SET reserved_balance = ${newReserved.toString()}::numeric(30,0), updated_at = now()
        WHERE id = ${row.id}::uuid
      `);
    }

    const updated = await tx.paypointConversion.update({
      where: { id: conversionId },
      data: { status: STATUS_FAILED },
    });
    return updated;
  });

  return toConversionRecord(result);
}

export async function getConversion(conversionId: string): Promise<ConversionRecord | null> {
  const conv = await prisma.paypointConversion.findUnique({
    where: { id: conversionId },
  });
  return conv ? toConversionRecord(conv) : null;
}

/** List conversions for a user (own list, for consumer/store UX). */
export async function listConversionsByUser(
  userId: string,
  limit = 50
): Promise<ConversionRecord[]> {
  const list = await prisma.paypointConversion.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return list.map((c: Parameters<typeof toConversionRecord>[0]) => toConversionRecord(c));
}

function toConversionRecord(c: {
  id: string;
  userId: string;
  type: string;
  fromAmount: { toString(): string };
  fromUnit: string;
  toAsset: string;
  status: string;
  txHash: string | null;
  settlementRef: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ConversionRecord {
  return {
    id: c.id,
    userId: c.userId,
    type: c.type,
    fromAmount: typeof c.fromAmount === 'object' ? c.fromAmount.toString() : String(c.fromAmount),
    fromUnit: c.fromUnit,
    toAsset: c.toAsset,
    status: c.status,
    txHash: c.txHash ?? undefined,
    settlementRef: c.settlementRef ?? undefined,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}
