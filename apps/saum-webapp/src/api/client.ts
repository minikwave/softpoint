const BASE = import.meta.env.VITE_API_URL ?? '';

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<{ data?: T; error?: { code: string; message: string } }> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
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
  created_at: string;
}

export interface TransactionsRes {
  user_id: string;
  items: TransactionItem[];
  next_cursor: string | null;
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

export const api = {
  getBalance(userId: string) {
    return request<BalanceRes>(`/v1/paypoint/balance/${encodeURIComponent(userId)}`);
  },

  getTransactions(userId: string, limit = 20, cursor?: string) {
    const params = new URLSearchParams({ user_id: userId, limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
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
