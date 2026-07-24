# SoftPoint — Idempotency cross-audit (Ownership Round3)

> Mode B · SoftPoint = earn / spend (별도 운영) · ≠ SoftPG credit  
> **SSOT**: Company OS `ops/softblock/SOFT_FEATURE_OWNERSHIP_SSOT.md`  
> Cross: SoftMint [`IDEMPOTENCY_CROSS_AUDIT.md`](https://github.com/minikwave/softmint) · NEXPORT `Idempotency-Key` on tx

## Present (honesty)

| Surface | Mechanism | Status |
|---------|-----------|--------|
| API body `idempotency_key` | `idempotency.ts` · Prisma `idempotencyRecord` upsert | **Present** (earn/activity · earn/payment · spend · redeem) |
| HTTP `Idempotency-Key` header | `resolveIdempotencyKey` — header preferred, body fallback | **Present** (Round3) |
| SoftPay SETTLED → earn | Hook `/hooks/softpay` · order_id keyed earn | Partial · production rail = Human |
| SDK helpers | `spendIdempotencyKey` · `redeemIdempotencyKey` | Present |
| `/info` honesty | `idempotency.header_status=present` | Present |

## Must

1. Retry-safe POST for earn / spend / issue / redeem  
2. Same key → same response (no double credit)  
3. SoftPG `pi_` / `rcpt_` **never** SoftPoint SoT  
4. Money amounts = integer string (SP minor) · float forbidden  

## Must NOT

- SoftLedger Execute · SoftPayAdapter ON · Visa Ready claims  
- SoftAgent paid-tool PG balances  

## Audit fields (thin)

| Field | Owner |
|-------|-------|
| `Idempotency-Key` / `idempotency_key` | request (header ≻ body) |
| `order_id` | SoftPay SETTLED earn collision key |
| `user_id` + activity_slug | activity earn |
| stored `response` JSON | SoftPoint idempotency store |

## Related

- [SOFT_FEATURE_OWNERSHIP.md](./SOFT_FEATURE_OWNERSHIP.md)
- [PAYPOINT_EARN_POLICY_AND_FLOW.md](./PAYPOINT_EARN_POLICY_AND_FLOW.md)
- SoftMint workflow `idempotencyKey` (orthogonal mint vertical)
