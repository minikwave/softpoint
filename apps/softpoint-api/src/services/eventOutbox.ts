/**
 * Lightweight outbound event log for SoftPay / partner hooks (Phase E outbox MVP).
 * In-memory ring buffer — replace with DB EventOutbox when scaling.
 */

export type OutboundEvent = {
  id: string;
  type: string;
  softpayIntentId?: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

const MAX = 200;
const buffer: OutboundEvent[] = [];

export async function recordOutboundEvent(input: {
  type: string;
  softpayIntentId?: string;
  payload: Record<string, unknown>;
}): Promise<OutboundEvent> {
  const row: OutboundEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: input.type,
    softpayIntentId: input.softpayIntentId,
    payload: input.payload,
    createdAt: new Date().toISOString(),
  };
  buffer.unshift(row);
  if (buffer.length > MAX) buffer.length = MAX;
  return row;
}

export function listOutboundEvents(limit = 50): OutboundEvent[] {
  return buffer.slice(0, Math.min(limit, MAX));
}
