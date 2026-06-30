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
  metadata?: { source?: string; reason?: string; [key: string]: unknown };
  created_at: string;
}

export interface TransactionsRes {
  user_id: string;
  items: TransactionItem[];
  next_cursor: string | null;
}

export interface PaymentEarnRes {
  amount: string;
  txId: string;
  receiptId?: string;
  policyId: string;
  policyVersion: string;
}

export interface IssueRes {
  accountId: string;
  user_id: string;
  amount: string;
  tx_id: string;
  receipt_id: string;
}

export interface EarnActivityItem {
  id: string;
  slug: string;
  activity_type: string;
  name_ko: string;
  name_en: string;
  description_ko?: string | null;
  description_en?: string | null;
  reward_label?: string | null;
  reward_amount?: string | null;
  status: string;
}

export interface CreditProductItem {
  id: string;
  provider: string;
  product_type: string;
  name: string;
  description: string | null;
  face_value: string;
  price_paypoint: string;
  category: string | null;
  status: string;
}

export interface RedeemRes {
  redemptionId: string;
  receiptId: string;
  productId: string;
  amount: string;
  status: string;
  codeDisplay?: string;
  providerRef?: string;
}

export interface RedemptionItem {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  receipt_id: string | null;
  status: string;
  code_display: string | null;
  provider_ref: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface ReceiptRecord {
  id: string;
  userId: string;
  merchantId?: string;
  intentType: string;
  status: string;
  amount: string;
  assetType: string;
  metadata?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptEventItem {
  id: string;
  type: string;
  payload?: unknown;
  createdAt: string;
}

export interface SpendRes {
  txId: string;
  receiptId: string;
  userId: string;
  amount: string;
  orderId: string;
  paymentEarn?: PaymentEarnRes | null;
}

export interface EarnLocationItem {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: string;
  lng: string;
  earn_rate: string | null;
}

export interface EarnLocationsRes {
  items: EarnLocationItem[];
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

  getTransactions(userId: string, limit = 20, cursor?: string, type?: string, source?: string) {
    const params = new URLSearchParams({ user_id: userId, limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    if (type) params.set('type', type);
    if (source) params.set('source', source);
    return request<TransactionsRes>(`/v1/paypoint/transactions?${params}`);
  },

  getEarnLocations(category?: string) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    const q = params.toString();
    return request<EarnLocationsRes>(`/v1/paypoint/earn-locations${q ? `?${q}` : ''}`);
  },

  earnFromPayment(body: {
    user_id: string;
    payment_amount: string;
    order_id: string;
    merchant_id?: string;
    idempotency_key?: string;
  }) {
    return request<{
      skipped: boolean;
      reason?: string;
      paymentEarn?: PaymentEarnRes;
    }>('/v1/paypoint/earn/payment', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  spend(body: { user_id: string; amount: string; order_id: string; idempotency_key?: string }) {
    return request<SpendRes>('/v1/paypoint/spend', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  requestConversion(body: { user_id: string; type: string; from_amount: string; to_asset: string; to_chain_id?: number }) {
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

  getEarnActivities() {
    return request<{ items: EarnActivityItem[] }>('/v1/paypoint/earn-activities');
  },

  earnActivity(body: {
    user_id: string;
    activity_slug: string;
    idempotency_key?: string;
    proof?: Record<string, unknown>;
  }) {
    return request<IssueRes>('/v1/paypoint/earn/activity', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getCreditProducts(category?: string) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    const q = params.toString();
    return request<{ items: CreditProductItem[] }>(`/v1/paypoint/credits/products${q ? `?${q}` : ''}`);
  },

  redeemProduct(body: { user_id: string; product_id: string; idempotency_key?: string }) {
    return request<RedeemRes>('/v1/paypoint/credits/redeem', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getRedemptions(userId: string, limit = 50) {
    const params = new URLSearchParams({ user_id: userId, limit: String(limit) });
    return request<{ user_id: string; items: RedemptionItem[] }>(`/v1/paypoint/credits/redemptions?${params}`);
  },

  getReceipt(id: string) {
    return request<ReceiptRecord>(`/v1/paypoint/receipts/${encodeURIComponent(id)}`);
  },

  getReceiptEvents(id: string) {
    return request<{ receipt_id: string; items: ReceiptEventItem[] }>(
      `/v1/paypoint/receipts/${encodeURIComponent(id)}/events`
    );
  },

  listReceipts(userId: string, limit = 30) {
    const params = new URLSearchParams({ user_id: userId, limit: String(limit) });
    return request<{ user_id: string; items: ReceiptRecord[] }>(`/v1/paypoint/receipts?${params}`);
  },
};
