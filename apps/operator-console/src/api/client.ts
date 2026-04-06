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
  if (!res.ok) return { error: json?.error ?? { code: 'ERROR', message: res.statusText } };
  return { data: json as T };
}

export interface AdminUserItem {
  account_id: string;
  user_id: string;
  balance: string;
  reserved_balance: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUsersRes {
  items: AdminUserItem[];
  count: number;
}

export interface AdminAccountRes {
  account_id: string;
  user_id: string;
  balance: string;
  reserved_balance: string;
  available: string;
  status: string;
  created_at: string;
  updated_at: string;
  timeline: Array<{
    tx_id: string;
    type: string;
    amount: string;
    order_id?: string;
    receipt_id?: string;
    created_at: string;
  }>;
}

export interface IssueRes {
  accountId: string;
  userId: string;
  amount: string;
  txId: string;
}

export interface ConversionItem {
  id: string;
  user_id: string;
  type: string;
  from_amount: string;
  to_asset: string;
  status: string;
  tx_hash?: string;
  settlement_ref?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminConversionsRes {
  items: ConversionItem[];
  count: number;
}

export interface AuditLogItem {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_id: string;
  before?: unknown;
  after?: unknown;
  request_id?: string;
  created_at: string;
}

export interface AdminAuditLogsRes {
  items: AuditLogItem[];
  next_cursor: string | null;
}

export const adminApi = {
  getUsers(params?: { user_id?: string; status?: string; limit?: string }) {
    const q = new URLSearchParams();
    if (params?.user_id) q.set('user_id', params.user_id);
    if (params?.status) q.set('status', params.status);
    if (params?.limit) q.set('limit', params.limit);
    const query = q.toString();
    return request<AdminUsersRes>(`/v1/admin/users${query ? `?${query}` : ''}`);
  },

  getAccount(userId: string) {
    return request<AdminAccountRes>(`/v1/admin/accounts/${encodeURIComponent(userId)}`);
  },

  issueCredit(body: {
    user_id: string;
    amount: string;
    reason: string;
    expires_at?: string;
    actor_id?: string;
    actor_role?: string;
  }) {
    return request<IssueRes>('/v1/admin/credits/issue', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getConversions(params?: { status?: string; user_id?: string; limit?: string }) {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.user_id) q.set('user_id', params.user_id);
    if (params?.limit) q.set('limit', params.limit);
    const query = q.toString();
    return request<AdminConversionsRes>(`/v1/admin/conversions${query ? `?${query}` : ''}`);
  },

  approveConversion(id: string) {
    return request<ConversionItem>(`/v1/admin/conversions/${id}/approve`, { method: 'POST' });
  },

  settleConversion(id: string, body?: { tx_hash?: string; settlement_ref?: string }) {
    return request<ConversionItem>(`/v1/admin/conversions/${id}/settle`, {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  },

  failConversion(id: string) {
    return request<ConversionItem>(`/v1/admin/conversions/${id}/fail`, { method: 'POST' });
  },

  getAuditLogs(params?: {
    actor_id?: string;
    action?: string;
    target_type?: string;
    limit?: string;
    cursor?: string;
  }) {
    const q = new URLSearchParams();
    if (params?.actor_id) q.set('actor_id', params.actor_id);
    if (params?.action) q.set('action', params.action);
    if (params?.target_type) q.set('target_type', params.target_type);
    if (params?.limit) q.set('limit', params.limit);
    if (params?.cursor) q.set('cursor', params.cursor);
    const query = q.toString();
    return request<AdminAuditLogsRes>(`/v1/admin/audit-logs${query ? `?${query}` : ''}`);
  },
};
