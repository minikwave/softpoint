import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { canSpend } from '@paypoint/domain';
import { appendLedgerEntry } from './ledger.js';
import { createReceipt, transitionReceipt } from './receipt.js';
import { getCreditProductById } from './productCatalog.js';
import { getIdempotentResponse, setIdempotentResponse } from './idempotency.js';
import { bigintToDecimal } from './account.js';

export interface RedeemResult {
  redemptionId: string;
  receiptId: string;
  productId: string;
  amount: string;
  status: string;
  codeDisplay?: string;
  providerRef?: string;
}

function mockVoucherCode(productName: string): string {
  const tail = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${productName.slice(0, 4).replace(/\s/g, '')}-${tail}`;
}

export async function redeemCreditProduct(params: {
  userId: string;
  productId: string;
  idempotencyKey: string;
}): Promise<RedeemResult> {
  const stored = await getIdempotentResponse(params.idempotencyKey);
  if (stored) return stored as RedeemResult;

  const product = await getCreditProductById(params.productId);
  if (!product) throw new Error('PRODUCT_NOT_FOUND');

  const price = BigInt(product.price_paypoint);
  if (price <= 0n) throw new Error('INVALID_PRODUCT_PRICE');

  const result = await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<
      { id: string; balance: string; reserved_balance: string }[]
    >(Prisma.sql`
      SELECT id, balance::text AS balance, reserved_balance::text AS reserved_balance
      FROM paypoint_accounts
      WHERE user_id = ${params.userId}
      FOR UPDATE
    `);

    let accountId: string;
    if (!locked.length) {
      throw new Error('ACCOUNT_NOT_FOUND');
    }

    const row = locked[0]!;
    accountId = row.id;
    const balance = BigInt(row.balance);
    const reserved = BigInt(row.reserved_balance);
    if (!canSpend({ balance, reserved_balance: reserved }, price)) {
      throw new Error('INSUFFICIENT_BALANCE');
    }

    const receipt = await createReceipt(tx, {
      userId: params.userId,
      intentType: 'REDEEM',
      amount: price,
      metadata: { product_id: params.productId, product_name: product.name },
    });

    await appendLedgerEntry(tx, {
      accountId,
      userId: params.userId,
      entryType: 'REDEEM',
      amount: price,
      receiptId: receipt.id,
      sourceType: 'redemption',
      sourceId: params.productId,
      idempotencyKey: `ledger:redeem:${params.idempotencyKey}`,
    });

    const code = mockVoucherCode(product.name);
    const providerRef = `MOCK-${Date.now()}`;

    const redemption = await tx.creditRedemption.create({
      data: {
        userId: params.userId,
        productId: params.productId,
        receiptId: receipt.id,
        status: 'FULFILLED',
        providerRef,
        codeDisplay: code,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        metadata: { provider: product.provider } as object,
      },
    });

    await tx.paypointTransaction.create({
      data: {
        accountId,
        type: 'SPEND',
        amount: bigintToDecimal(price),
        orderId: `redeem:${redemption.id}`,
        receiptId: receipt.id,
        metadata: {
          source: 'REDEMPTION',
          product_id: params.productId,
          redemption_id: redemption.id,
        } as object,
      },
    });

    await transitionReceipt(tx, receipt.id, 'COMPLETED', 'FULFILLED', {
      redemption_id: redemption.id,
      code_display: code,
    });

    return {
      redemptionId: redemption.id,
      receiptId: receipt.id,
      productId: params.productId,
      amount: price.toString(),
      status: redemption.status,
      codeDisplay: code,
      providerRef,
    };
  });

  await setIdempotentResponse(params.idempotencyKey, result);
  return result;
}

export async function listRedemptionsByUser(userId: string, limit = 50) {
  const rows = await prisma.creditRedemption.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 100),
    include: { product: true },
  });

  return rows.map((r) => ({
    id: r.id,
    user_id: r.userId,
    product_id: r.productId,
    product_name: r.product.name,
    receipt_id: r.receiptId,
    status: r.status,
    code_display: r.codeDisplay,
    provider_ref: r.providerRef,
    expires_at: r.expiresAt?.toISOString() ?? null,
    created_at: r.createdAt.toISOString(),
  }));
}
