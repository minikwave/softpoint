import type { FastifyRequest } from 'fastify';

/**
 * SoftPay/SoftAgent parity: prefer HTTP `Idempotency-Key`, fall back to body `idempotency_key`.
 * SoftPoint ≠ SoftPG — loyalty rail only.
 */
export function resolveIdempotencyKey(
  request: FastifyRequest,
  bodyKey?: string | null
): string | undefined {
  const raw = request.headers['idempotency-key'];
  const fromHeader = Array.isArray(raw) ? raw[0] : raw;
  const header = typeof fromHeader === 'string' ? fromHeader.trim() : '';
  if (header) return header;
  const body = typeof bodyKey === 'string' ? bodyKey.trim() : '';
  return body || undefined;
}
