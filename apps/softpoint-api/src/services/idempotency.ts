import { prisma } from '../lib/prisma.js';

/**
 * SoftPoint idempotency store (Ownership Round2).
 * Body `idempotency_key` → replay stored response (earn/spend/issue).
 * SoftPoint ≠ SoftPG · SoftLedger Execute Never · SoftPayAdapter ON = Human.
 * Cross-audit: docs/IDEMPOTENCY_CROSS_AUDIT.md
 */

/**
 * Get stored response for idempotency key. Returns null if not found.
 */
export async function getIdempotentResponse(key: string): Promise<unknown | null> {
  const row = await prisma.idempotencyRecord.findUnique({
    where: { idempotencyKey: key },
  });
  return row ? (row.response as unknown) : null;
}

/**
 * Store response for idempotency key. Call after successful operation.
 */
export async function setIdempotentResponse(key: string, response: object): Promise<void> {
  await prisma.idempotencyRecord.upsert({
    where: { idempotencyKey: key },
    create: { idempotencyKey: key, response: response as object },
    update: { response: response as object },
  });
}
