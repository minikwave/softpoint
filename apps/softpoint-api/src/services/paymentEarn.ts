import type { Prisma } from '@prisma/client';
import { calculatePaymentEarnAmount, PAYMENT_EARN_POLICY_ID } from '@softpoint/domain';
import { getActivePaymentEarnPolicy } from './earnPolicy.js';
import { getIdempotentResponse, setIdempotentResponse } from './idempotency.js';
import { issueCredit, issueCreditInTransaction, type IssueResult } from './issue.js';

export interface PaymentEarnInfo {
  amount: string;
  txId: string;
  receiptId: string;
  policyId: string;
  policyVersion: string;
}

export interface EarnFromPaymentParams {
  userId: string;
  paymentAmount: bigint;
  orderId: string;
  merchantId?: string;
  idempotencyKey?: string;
}

export interface EarnFromPaymentResult {
  skipped: boolean;
  reason?: 'ZERO_EARN' | 'NO_POLICY';
  paymentEarn?: PaymentEarnInfo;
  issue?: IssueResult;
}

function paymentEarnIdempotencyKey(orderId: string): string {
  return `issue:PAYMENT_EARN:${orderId}`;
}

export async function earnFromPayment(params: EarnFromPaymentParams): Promise<EarnFromPaymentResult> {
  const { userId, paymentAmount, orderId, merchantId } = params;
  if (paymentAmount <= 0n) throw new Error('INVALID_AMOUNT');

  const idempotencyKey = params.idempotencyKey ?? paymentEarnIdempotencyKey(orderId);
  const stored = await getIdempotentResponse(idempotencyKey);
  if (stored) {
    return stored as EarnFromPaymentResult;
  }

  const policy = await getActivePaymentEarnPolicy();
  if (!policy) {
    const out: EarnFromPaymentResult = { skipped: true, reason: 'NO_POLICY' };
    await setIdempotentResponse(idempotencyKey, out);
    return out;
  }

  const earnAmount = calculatePaymentEarnAmount(paymentAmount, policy.policyJson);
  if (earnAmount <= 0n) {
    const out: EarnFromPaymentResult = { skipped: true, reason: 'ZERO_EARN' };
    await setIdempotentResponse(idempotencyKey, out);
    return out;
  }

  const issue = await issueCredit({
    userId,
    amount: earnAmount,
    reason: 'PAYMENT_EARN',
    orderId,
    idempotencyKey: `ledger:earn:${orderId}`,
    metadata: {
      source: 'PAYMENT_EARN',
      order_id: orderId,
      payment_amount: paymentAmount.toString(),
      merchant_id: merchantId ?? null,
      policy_id: policy.policyId,
      policy_version: policy.version,
    },
  });

  const paymentEarn: PaymentEarnInfo = {
    amount: earnAmount.toString(),
    txId: issue.txId,
    receiptId: issue.receiptId,
    policyId: policy.policyId,
    policyVersion: policy.version,
  };

  const out: EarnFromPaymentResult = { skipped: false, paymentEarn, issue };
  await setIdempotentResponse(idempotencyKey, out);
  return out;
}

export async function applyPaymentEarnInSpendTx(
  tx: Prisma.TransactionClient,
  input: {
    accountId: string;
    userId: string;
    spendAmount: bigint;
    orderId: string;
    parentReceiptId?: string;
  }
): Promise<PaymentEarnInfo | null> {
  const policy = await tx.paypointPolicy.findFirst({
    where: { policyId: PAYMENT_EARN_POLICY_ID, status: 'ACTIVE' },
    orderBy: [{ effectiveFrom: 'desc' }, { updatedAt: 'desc' }],
  });
  if (!policy) return null;

  const earnAmount = calculatePaymentEarnAmount(input.spendAmount, policy.policyJson);
  if (earnAmount <= 0n) return null;

  const earnOrderId = `earn:${input.orderId}`;
  const existing = await tx.paypointTransaction.findFirst({
    where: { accountId: input.accountId, type: 'ISSUE', orderId: earnOrderId },
  });
  if (existing) return null;

  const issue = await issueCreditInTransaction(tx, {
    userId: input.userId,
    amount: earnAmount,
    reason: 'PAYMENT_EARN',
    orderId: earnOrderId,
    idempotencyKey: `ledger:earn:${input.orderId}`,
    metadata: {
      source: 'PAYMENT_EARN',
      trigger: 'SPEND_CASHBACK',
      parent_receipt_id: input.parentReceiptId,
      payment_amount: input.spendAmount.toString(),
      policy_id: policy.policyId,
      policy_version: policy.version,
    },
  });

  return {
    amount: earnAmount.toString(),
    txId: issue.txId,
    receiptId: issue.receiptId,
    policyId: policy.policyId,
    policyVersion: policy.version,
  };
}
