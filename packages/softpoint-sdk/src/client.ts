import { createHttpClient, type HttpClientOptions } from './http.js';
import type {
  ApiInfoRes,
  BalanceRes,
  ConversionsListRes,
  ConversionRes,
  CreditProductItem,
  EarnActivityItem,
  EarnLocationItem,
  HealthRes,
  IssueRes,
  MarketListingItem,
  PaymentEarnRes,
  ReceiptEventItem,
  ReceiptRecord,
  RedeemRes,
  RedemptionItem,
  SpendRes,
  TransactionsRes,
} from './types.js';

export type SoftPointClientOptions = HttpClientOptions;

export function createSoftPointClient(options: SoftPointClientOptions = {}) {
  const { request } = createHttpClient(options);

  return {
    health() {
      return request<HealthRes>('/health');
    },

    getInfo() {
      return request<ApiInfoRes>('/v1/paypoint/info');
    },

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

    issue(body: {
      user_id: string;
      amount: string;
      reason?: string;
      idempotency_key?: string;
      order_id?: string;
    }) {
      return request<IssueRes>('/v1/paypoint/issue', {
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

    earnFromPayment(body: {
      user_id: string;
      payment_amount: string;
      order_id: string;
      merchant_id?: string;
      idempotency_key?: string;
    }) {
      return request<{ skipped: boolean; reason?: string; paymentEarn?: PaymentEarnRes }>(
        '/v1/paypoint/earn/payment',
        { method: 'POST', body: JSON.stringify(body) }
      );
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

    getEarnLocations(category?: string) {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      const q = params.toString();
      return request<{ items: EarnLocationItem[] }>(`/v1/paypoint/earn-locations${q ? `?${q}` : ''}`);
    },

    getCreditProducts(category?: string, productType?: string) {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (productType) params.set('product_type', productType);
      const q = params.toString();
      return request<{ items: CreditProductItem[] }>(`/v1/paypoint/credits/products${q ? `?${q}` : ''}`);
    },

    getCreditProduct(id: string) {
      return request<CreditProductItem>(`/v1/paypoint/credits/products/${encodeURIComponent(id)}`);
    },

    redeemProduct(body: { user_id: string; product_id: string; idempotency_key?: string }) {
      return request<RedeemRes>('/v1/paypoint/credits/redeem', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },

    getRedemptions(userId: string, limit = 50) {
      const params = new URLSearchParams({ user_id: userId, limit: String(limit) });
      return request<{ user_id: string; items: RedemptionItem[] }>(
        `/v1/paypoint/credits/redemptions?${params}`
      );
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

    requestConversion(body: {
      user_id: string;
      type: string;
      from_amount: string;
      to_asset: string;
      to_chain_id?: number;
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

    getMarketListings() {
      return request<{ items: MarketListingItem[] }>('/v1/paypoint/market/listings');
    },
  };
}

export type SoftPointClient = ReturnType<typeof createSoftPointClient>;
