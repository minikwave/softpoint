import { prisma } from '../lib/prisma.js';

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
