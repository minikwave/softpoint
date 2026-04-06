const BASE = import.meta.env.VITE_API_URL ?? '';

/** When API has USER_JWT_SECRET, set VITE_USER_JWT or localStorage paypoint_jwt (HS256, sub=user_id). */
function userAuthHeaders(): Record<string, string> {
  const fromEnv = import.meta.env.VITE_USER_JWT as string | undefined;
  const fromLs =
    typeof localStorage !== 'undefined' ? localStorage.getItem('paypoint_jwt') : null;
  const token = (fromEnv?.trim() || fromLs?.trim()) ?? '';
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<{ data?: T; error?: { code: string; message: string } }> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...userAuthHeaders(), ...options?.headers },
    ...options,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: json?.error ?? { code: 'ERROR', message: res.statusText } };
  }
  return { data: json as T };
}

export interface BalanceRes {
  user_id: string;
  balance: string;
  reserved_balance: string;
  available: string;
}

export interface TransactionItem {
  tx_id: string;
  type: string;
  amount: string;
  order_id?: string;
  receipt_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface TransactionsRes {
  user_id: string;
  items: TransactionItem[];
  next_cursor: string | null;
}

/** GET /v1/paypoint/transactions 옵션 (type·source는 API 쿼리와 동일) */
export interface GetTransactionsOpts {
  limit?: number;
  cursor?: string;
  /** metadata.source 문자열 전체 일치 */
  source?: string;
  /** ISSUE | SPEND | EXPIRE | ADJUST */
  type?: string;
}

export interface SpendRes {
  txId: string;
  receiptId: string;
  userId: string;
  amount: string;
  orderId: string;
}

export interface ConversionRes {
  id: string;
  userId: string;
  type: string;
  fromAmount: string;
  fromUnit: string;
  toAsset: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  txHash?: string;
  settlementRef?: string;
}

export interface ConversionsListRes {
  user_id: string;
  items: ConversionRes[];
}

export interface EarnLocationItem {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  earn_rate?: string;
}

export interface EarnLocationsRes {
  items: EarnLocationItem[];
}

export const api = {
  getEarnLocations(opts?: { category?: string }) {
    const params = new URLSearchParams();
    if (opts?.category?.trim()) params.set('category', opts.category.trim());
    const q = params.toString();
    return request<EarnLocationsRes>(`/v1/paypoint/earn-locations${q ? `?${q}` : ''}`);
  },

  getBalance(userId: string) {
    return request<BalanceRes>(`/v1/paypoint/balance/${encodeURIComponent(userId)}`);
  },

  getTransactions(userId: string, opts: GetTransactionsOpts = {}) {
    const { limit = 20, cursor, source, type } = opts;
    const params = new URLSearchParams({ user_id: userId, limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    if (source?.trim()) params.set('source', source.trim());
    if (type?.trim()) params.set('type', type.trim().toUpperCase());
    return request<TransactionsRes>(`/v1/paypoint/transactions?${params}`);
  },

  spend(body: { user_id: string; amount: string; order_id: string; idempotency_key?: string }) {
    return request<SpendRes>('/v1/paypoint/spend', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  requestConversion(body: {
    user_id: string;
    type: string;
    from_amount: string;
    to_asset: string;
    to_chain_id?: number;
    idempotency_key?: string;
    client_request_id?: string;
  }) {
    return request<ConversionRes>('/v1/paypoint/conversion/request', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getConversion(id: string) {
    return request<ConversionRes>(`/v1/paypoint/conversion/${encodeURIComponent(id)}`);
  },

  getConversions(userId: string, limit?: number) {
    const params = new URLSearchParams({ user_id: userId });
    if (limit != null) params.set('limit', String(limit));
    return request<ConversionsListRes>(`/v1/paypoint/conversions?${params}`);
  },
};
