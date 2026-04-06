import * as jose from 'jose';

const ALG = 'HS256';

/**
 * When USER_JWT_SECRET is set (non-empty), all `/v1/paypoint/*` routes require
 * `Authorization: Bearer <JWT>`. The JWT must use HS256; **`sub` claim = user_id**
 * and must match the `user_id` used in path, query, or body.
 */
export function getUserJwtSecretBytes(): Uint8Array | null {
  const s = process.env['USER_JWT_SECRET']?.trim();
  if (!s) return null;
  return new TextEncoder().encode(s);
}

export function isUserJwtEnforced(): boolean {
  return getUserJwtSecretBytes() !== null;
}

export async function verifyUserBearerToken(token: string): Promise<string> {
  const secret = getUserJwtSecretBytes();
  if (!secret) throw new Error('JWT_NOT_CONFIGURED');

  const { payload } = await jose.jwtVerify(token, secret, {
    algorithms: [ALG],
  });

  const uid = typeof payload.sub === 'string' ? payload.sub.trim() : '';
  if (!uid) throw new Error('INVALID_TOKEN_SUB');

  return uid;
}
