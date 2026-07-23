import { createHmac, timingSafeEqual } from 'node:crypto';
import { earnFromPayment, type EarnFromPaymentResult } from './paymentEarn.js';

/**
 * SoftPay Runtime webhook → SoftPoint payment earn.
 * SoftPG agent credit (pi_/rcpt_) is intentionally NOT handled here.
 */

export type SoftPayWebhookEnvelope = {
  id?: string;
  type: string;
  intentId: string;
  payload?: Record<string, unknown>;
  createdAt?: string;
};

const EARN_EVENTS = new Set([
  'settlement.completed',
  'payment.executed',
  'receipt.generated',
]);

export function softPayEarnEnabled(): boolean {
  if (process.env['SOFTPAY_EARN_ENABLED'] === '0') return false;
  return Boolean(process.env['SOFTPAY_WEBHOOK_SECRET']?.trim());
}

export function getSoftPayWebhookSecret(): string {
  return process.env['SOFTPAY_WEBHOOK_SECRET']?.trim() ?? '';
}

export function verifySoftPaySignature(rawBody: string, header: string | undefined): boolean {
  const secret = getSoftPayWebhookSecret();
  if (!secret || !header) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const received = header.startsWith('sha256=') ? header.slice(7) : header;
  if (received.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(received, 'utf8'), Buffer.from(expected, 'utf8'));
  } catch {
    return false;
  }
}

function asPositiveBigInt(v: unknown): bigint | null {
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return BigInt(Math.floor(v));
  if (typeof v === 'string' && /^\d+$/.test(v) && v !== '0') return BigInt(v);
  return null;
}

/**
 * Map SoftPay settlement webhook to SoftPoint earn.
 * user_id: payload.payerId | payload.actorId | payload.userId | SOFTPAY_DEFAULT_USER_ID | "softpay-guest"
 */
export async function earnFromSoftPayWebhook(
  envelope: SoftPayWebhookEnvelope
): Promise<{
  handled: boolean;
  skipped?: boolean;
  reason?: string;
  result?: EarnFromPaymentResult;
}> {
  if (!EARN_EVENTS.has(envelope.type)) {
    return { handled: false, reason: 'IGNORED_EVENT' };
  }

  const payload = envelope.payload ?? {};
  const status = String(payload['status'] ?? '').toUpperCase();
  if (status && status !== 'SETTLED' && envelope.type === 'payment.executed') {
    return { handled: true, skipped: true, reason: 'NOT_SETTLED' };
  }

  const amount =
    asPositiveBigInt(payload['amount']) ??
    asPositiveBigInt((payload['summary'] as Record<string, unknown> | undefined)?.['amount']);
  if (!amount) {
    return { handled: true, skipped: true, reason: 'NO_AMOUNT' };
  }

  const userId = String(
    payload['payerId'] ??
      payload['actorId'] ??
      payload['userId'] ??
      process.env['SOFTPAY_DEFAULT_USER_ID'] ??
      'softpay-guest'
  ).trim();

  const merchantId =
    typeof payload['merchantId'] === 'string' ? payload['merchantId'] : undefined;
  const intentId = envelope.intentId?.trim();
  if (!intentId) {
    return { handled: true, skipped: true, reason: 'NO_INTENT_ID' };
  }

  const result = await earnFromPayment({
    userId,
    paymentAmount: amount,
    orderId: intentId,
    merchantId,
    softpayIntentId: intentId,
    softpayDeliveryId: envelope.id,
    softpayEvent: envelope.type,
  });

  return { handled: true, skipped: result.skipped, result };
}
