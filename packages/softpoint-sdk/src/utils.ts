/** Generate a unique idempotency key for write operations */
export function createIdempotencyKey(scope: string, ...parts: string[]): string {
  return `${scope}:${parts.join(':')}:${Date.now()}`;
}

/** Default idempotency key for spend */
export function spendIdempotencyKey(userId: string, orderId: string): string {
  return `spend:${userId}:${orderId}`;
}

/** Default idempotency key for redeem */
export function redeemIdempotencyKey(userId: string, productId: string): string {
  return `redeem:${userId}:${productId}:${Date.now()}`;
}
