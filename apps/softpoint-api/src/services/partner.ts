/** Partner sandbox metadata — self-serve onboarding stub (P1-2) */
export function getPartnerSandboxInfo() {
  return {
    sandbox: true,
    api_version: '0.2.0',
    user_api_prefix: '/v1/paypoint',
    admin_api_prefix: '/v1/admin',
    docs: [
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
    ],
    auth: {
      user: 'USER_JWT_SECRET → Bearer JWT (sub = user_id)',
      admin: 'ADMIN_API_KEY → x-admin-api-key',
    },
    next_steps: [
      'Request production keys from ops',
      'Map partner user_id ↔ SoftPoint user_id',
      'Run pilot with idempotency keys',
    ],
  };
}
