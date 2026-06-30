import type { IncomingHttpHeaders } from 'node:http';

/**
 * When ADMIN_API_KEY is set, all /v1/admin routes require the key via
 * `x-admin-api-key` or `Authorization: Bearer <key>`.
 * When unset, admin routes stay open (local dev).
 */
export function getRequiredAdminApiKey(): string | undefined {
  const v = process.env['ADMIN_API_KEY']?.trim();
  return v && v.length > 0 ? v : undefined;
}

export function extractAdminApiKey(headers: IncomingHttpHeaders): string {
  const raw = headers['x-admin-api-key'];
  const fromHeader = Array.isArray(raw) ? raw[0] : raw;
  if (fromHeader && typeof fromHeader === 'string' && fromHeader.trim()) {
    return fromHeader.trim();
  }
  const auth = headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return '';
}
