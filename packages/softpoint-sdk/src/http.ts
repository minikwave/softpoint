import type { ApiError, ApiResult } from './types.js';

export type HttpClientOptions = {
  baseUrl?: string;
  /** Static Bearer token or async provider (JWT) */
  getAccessToken?: () => string | undefined | Promise<string | undefined>;
  /** Admin API key (x-admin-api-key) */
  adminApiKey?: string;
  fetch?: typeof fetch;
};

export function createHttpClient(options: HttpClientOptions = {}) {
  const baseUrl = (options.baseUrl ?? '').replace(/\/$/, '');
  const fetchFn = options.fetch ?? fetch;

  async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    };

    if (options.adminApiKey) {
      headers['x-admin-api-key'] = options.adminApiKey;
    }

    const token = options.getAccessToken ? await options.getAccessToken() : undefined;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetchFn(`${baseUrl}${path}`, { ...init, headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = (json as { error?: ApiError })?.error;
      return { error: err ?? { code: 'HTTP_ERROR', message: res.statusText } };
    }
    return { data: json as T };
  }

  return { request, baseUrl };
}

export type HttpClient = ReturnType<typeof createHttpClient>;
