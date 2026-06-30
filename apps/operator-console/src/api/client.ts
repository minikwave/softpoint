import { createSoftPointAdminClient } from '@softpoint/sdk';

export type {
  AdminUserItem,
  AdminAccountRes,
  AdminIssueRes as IssueRes,
  ConversionItem,
  PolicyItem,
  ExceptionItem,
  AuditLogItem,
  ReserveRes,
  DashboardRes,
  AdminReceiptItem,
} from '@softpoint/sdk';

const adminKey = import.meta.env.VITE_ADMIN_API_KEY?.trim() ?? '';

const admin = createSoftPointAdminClient({
  baseUrl: import.meta.env.VITE_API_URL ?? '',
  adminApiKey: adminKey,
});

export const adminApi = {
  getUsers: (params?: Parameters<typeof admin.getUsers>[0]) => admin.getUsers(params),
  getAccount: (userId: string) => admin.getAccount(userId),
  issueCredit: (body: Parameters<typeof admin.issueCredit>[0]) => admin.issueCredit(body),
  getConversions: (params?: Parameters<typeof admin.getConversions>[0]) => admin.getConversions(params),
  approveConversion: (id: string) => admin.approveConversion(id),
  settleConversion: (id: string, body?: Parameters<typeof admin.settleConversion>[1]) =>
    admin.settleConversion(id, body),
  failConversion: (id: string) => admin.failConversion(id),
  getPolicies: (params?: Parameters<typeof admin.getPolicies>[0]) => admin.getPolicies(params),
  createPolicyDraft: (body: Parameters<typeof admin.createPolicyDraft>[0]) => admin.createPolicyDraft(body),
  submitPolicy: (body: Parameters<typeof admin.submitPolicy>[0]) => admin.submitPolicy(body),
  approvePolicy: (body: Parameters<typeof admin.approvePolicy>[0]) => admin.approvePolicy(body),
  activatePolicy: (body: Parameters<typeof admin.activatePolicy>[0]) => admin.activatePolicy(body),
  getExceptions: (params?: Parameters<typeof admin.getExceptions>[0]) => admin.getExceptions(params),
  enqueueException: (body: Parameters<typeof admin.enqueueException>[0]) => admin.enqueueException(body),
  resolveException: (
    id: string,
    body: Parameters<typeof admin.resolveException>[1]
  ) => admin.resolveException(id, body),
  getDashboard: () => admin.getDashboard(),
  getReserve: () => admin.getReserve(),
  getReceipts: (params?: Parameters<typeof admin.getReceipts>[0]) => admin.getReceipts(params),
  getAuditLogs: (params?: Parameters<typeof admin.getAuditLogs>[0]) => admin.getAuditLogs(params),
};
