# SoftPoint SDK — `@softpoint/sdk`

TypeScript SDK for the SoftPoint Engine API. Use the same client in partner backends, the consumer web app, and the operator console.

## Install (monorepo)

```bash
pnpm add @softpoint/sdk --filter your-app
```

Build:

```bash
pnpm --filter @softpoint/sdk run build
```

## User API client

```typescript
import {
  createSoftPointClient,
  spendIdempotencyKey,
  redeemIdempotencyKey,
} from '@softpoint/sdk';

const sp = createSoftPointClient({
  baseUrl: 'https://softpoint-production.up.railway.app',
  // Optional when USER_JWT_SECRET is set on the API
  getAccessToken: async () => process.env.SOFTPOINT_USER_JWT,
});

// Discovery
const { data: info } = await sp.getInfo();

// Balance & history
const { data: balance } = await sp.getBalance('U1');
const { data: txs } = await sp.getTransactions('U1', 20);

// Grant (campaign / partner)
await sp.issue({ user_id: 'U1', amount: '500', reason: 'welcome_bonus' });

// Spend with idempotency
await sp.spend({
  user_id: 'U1',
  amount: '2000',
  order_id: 'ORDER_001',
  idempotency_key: spendIdempotencyKey('U1', 'ORDER_001'),
});

// Payment earn (PG callback)
await sp.earnFromPayment({
  user_id: 'U1',
  payment_amount: '50000',
  order_id: 'PAY_001',
});

// Activity earn (Walk / ads)
await sp.earnActivity({
  user_id: 'U1',
  activity_slug: 'walk-daily',
  idempotency_key: `walk:U1:${new Date().toISOString().slice(0, 10)}`,
});

// Gift cards
const { data: products } = await sp.getCreditProducts();
await sp.redeemProduct({
  user_id: 'U1',
  product_id: products!.items[0].id,
  idempotency_key: redeemIdempotencyKey('U1', products!.items[0].id),
});

// Receipts
const { data: receipts } = await sp.listReceipts('U1');

// Marketplace (demo listings)
const { data: market } = await sp.getMarketListings();
```

## Admin client

```typescript
import { createSoftPointAdminClient } from '@softpoint/sdk';

const admin = createSoftPointAdminClient({
  baseUrl: 'https://softpoint-production.up.railway.app',
  adminApiKey: process.env.ADMIN_API_KEY!,
});

const { data: dashboard } = await admin.getDashboard();
await admin.issueCredit({ user_id: 'U1', amount: '1000', reason: 'ops_grant' });
```

## Error handling

All methods return `{ data?, error? }` where `error` is `{ code, message }`.

## API paths

| Surface | Prefix |
|---------|--------|
| User | `/v1/paypoint/*` |
| Admin | `/v1/admin/*` |
| Health | `/health` |
| Info | `/v1/paypoint/info` |

See also [INTEGRATION_ONBOARDING.md](./INTEGRATION_ONBOARDING.md) and [DEPLOY.md](./DEPLOY.md).
