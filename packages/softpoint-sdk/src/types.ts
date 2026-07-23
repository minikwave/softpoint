/** Shared API error shape */
export interface ApiError {
  code: string;
  message: string;
}

export type ApiResult<T> = { data?: T; error?: ApiError };

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

export interface MarketListingItem {
  id: string;
  title: string;
  price_sp: string;
  seller_id: string;
  status: 'demo' | 'active' | 'sold';
  description?: string;
}

export interface ApiInfoRes {
  service: string;
  version: string;
  product?: string;
  unit?: string;
  features: string[];
  softpay?: {
    earn_webhook?: string;
    earn_enabled?: boolean;
    loyalty_rail?: string;
    note?: string;
  };
  paths: {
    user: string;
    admin: string;
    health: string;
    softpay_hook?: string;
  };
}

export interface HealthRes {
  status: string;
  service: string;
}
