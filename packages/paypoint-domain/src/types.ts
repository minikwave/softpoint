/**
 * PayPoint (saum) - Core domain types
 * SSOT: Engine owns these concepts; UI/Console only consume via API.
 */

export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface User {
  user_id: string;
  wallet_address?: string;
  status: UserStatus;
}

export interface PayPointAccount {
  account_id: string;
  user_id: string;
  balance: bigint;
  reserved_balance: bigint;
  status: 'ACTIVE' | 'SUSPENDED';
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'ISSUE' | 'SPEND' | 'EXPIRE' | 'ADJUST';

export interface PayPointTransaction {
  tx_id: string;
  account_id: string;
  type: TransactionType;
  amount: bigint;
  order_id?: string;
  receipt_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export type ConversionType = 'USER_CASHOUT' | 'MERCHANT_SETTLEMENT' | 'TREASURY';

export type ConversionStatus =
  | 'REQUESTED'
  | 'AUTHORIZED'
  | 'QUOTED'
  | 'EXECUTING'
  | 'SETTLED'
  | 'FAILED';

export interface PayPointConversion {
  conversion_id: string;
  user_id: string;
  type: ConversionType;
  from_amount: bigint;
  from_unit: string;
  to_asset: string;
  to_chain_id?: number;
  status: ConversionStatus;
  quote?: Record<string, unknown>;
  tx_hash?: string;
  settlement_ref?: string;
  created_at: string;
  updated_at: string;
}

/** API DTOs (string amounts for JSON) */
export interface IssueCreditInput {
  user_id: string;
  amount: string;
  reason: string;
  expires_at?: string;
  /** 적립 출처·외부 참조·캠페인 (트랜잭션 metadata에 저장) */
  source?: string;
  external_ref?: string;
  campaign_id?: string;
}

export interface SpendCreditInput {
  user_id: string;
  amount: string;
  order_id: string;
  idempotency_key?: string;
}

export interface AuditLogEntry {
  audit_id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_id: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  request_id?: string;
  created_at: string;
}
