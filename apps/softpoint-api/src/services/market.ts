/** Demo marketplace listings — Phase E will replace with DB + escrow */
export const DEMO_MARKET_LISTINGS = [
  {
    id: 'L1',
    title: '5,000 SP bundle',
    price_sp: '4800',
    seller_id: 'user_demo_1',
    status: 'demo' as const,
    description: 'Demo listing for UI and SDK integration tests.',
  },
  {
    id: 'L2',
    title: '10,000 SP bundle',
    price_sp: '9500',
    seller_id: 'user_demo_2',
    status: 'demo' as const,
    description: 'Bulk SP at a small discount (demo only).',
  },
  {
    id: 'L3',
    title: 'Walk mission boost',
    price_sp: '1200',
    seller_id: 'partner_walk',
    status: 'demo' as const,
    description: 'Activity reward boost voucher (demo).',
  },
];

export function listMarketListings() {
  return DEMO_MARKET_LISTINGS;
}
