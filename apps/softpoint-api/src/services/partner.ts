/** Partner sandbox metadata — self-serve onboarding stub (P1-2) */
export function getPartnerSandboxInfo() {
  return {
    sandbox: true,
    api_version: '0.2.0',
    product: 'SoftPoint',
    unit: 'SP',
    user_api_prefix: '/v1/paypoint',
    admin_api_prefix: '/v1/admin',
    softpay_hook: '/hooks/softpay',
    docs: [
      'docs/SOFT_STACK_BOUNDARY.md',
      'docs/INTEGRATION_SDK.md',
      'docs/INTEGRATION_ONBOARDING.md',
    ],
    demo_user_id: 'U1',
    features: [
      'issue',
      'spend',
      'earn-payment',
      'earn-activity',
      'credits-redeem',
      'receipts',
      'market-demo',
      'softpay-earn-webhook',
    ],
    softpay: {
      role: 'SoftPay Pilot loyalty / rewards layer',
      earn_events: ['settlement.completed', 'payment.executed', 'receipt.generated'],
      loyalty_rail_id: 'softpoint_sp',
      not: 'SoftPG agent credit (pi_/rcpt_) — never use SoftPoint as SoftAgent credit path',
    },
    softpg: {
      collision: false,
      note: 'SoftPG owns SoftAgent credit. SoftPoint does not implement SoftPG APIs.',
    },
    auth: {
      user: 'USER_JWT_SECRET → Bearer JWT (sub = user_id)',
      admin: 'ADMIN_API_KEY → x-admin-api-key',
      softpay_webhook: 'SOFTPAY_WEBHOOK_SECRET → X-SoftPay-Signature',
    },
    next_steps: [
      'Set SOFTPAY_WEBHOOK_SECRET to match SoftPay WEBHOOK_SECRET',
      'Register SoftPoint /hooks/softpay as SoftPay webhook subscriber',
      'Map SoftPay payerId ↔ SoftPoint user_id',
      'Request production keys from ops',
      'Run pilot with idempotency keys',
    ],
  };
}
