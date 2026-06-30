import {
  createSoftPointClient,
  createIdempotencyKey,
  spendIdempotencyKey,
  redeemIdempotencyKey,
} from '@softpoint/sdk';

export type * from '@softpoint/sdk';

const token = import.meta.env.VITE_USER_JWT?.trim();

export const softpoint = createSoftPointClient({
  baseUrl: import.meta.env.VITE_API_URL ?? '',
  getAccessToken: token ? () => token : undefined,
});

/** @deprecated Prefer `softpoint` — kept for page imports */
export const api = {
  health: () => softpoint.health(),
  getInfo: () => softpoint.getInfo(),
  getBalance: (userId: string) => softpoint.getBalance(userId),
  getTransactions: (
    userId: string,
    limit?: number,
    cursor?: string,
    type?: string,
    source?: string
  ) => softpoint.getTransactions(userId, limit, cursor, type, source),
  issue: (body: Parameters<typeof softpoint.issue>[0]) => softpoint.issue(body),
  spend: (body: Parameters<typeof softpoint.spend>[0]) => softpoint.spend(body),
  earnFromPayment: (body: Parameters<typeof softpoint.earnFromPayment>[0]) =>
    softpoint.earnFromPayment(body),
  getEarnLocations: (category?: string) => softpoint.getEarnLocations(category),
  getEarnActivities: () => softpoint.getEarnActivities(),
  earnActivity: (body: Parameters<typeof softpoint.earnActivity>[0]) => softpoint.earnActivity(body),
  getCreditProducts: (category?: string) => softpoint.getCreditProducts(category),
  getCreditProduct: (id: string) => softpoint.getCreditProduct(id),
  redeemProduct: (body: Parameters<typeof softpoint.redeemProduct>[0]) => softpoint.redeemProduct(body),
  getRedemptions: (userId: string, limit?: number) => softpoint.getRedemptions(userId, limit),
  getReceipt: (id: string) => softpoint.getReceipt(id),
  getReceiptEvents: (id: string) => softpoint.getReceiptEvents(id),
  listReceipts: (userId: string, limit?: number) => softpoint.listReceipts(userId, limit),
  requestConversion: (body: Parameters<typeof softpoint.requestConversion>[0]) =>
    softpoint.requestConversion(body),
  getConversion: (id: string) => softpoint.getConversion(id),
  getConversions: (userId: string, limit?: number) => softpoint.getConversions(userId, limit),
  getMarketListings: () => softpoint.getMarketListings(),
  getPartnerSandbox: () => softpoint.getPartnerSandbox(),
};

export { createIdempotencyKey, spendIdempotencyKey, redeemIdempotencyKey };
