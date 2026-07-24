# SoftPoint — Soft* Feature Ownership

> Mode B · Ownership Round3 · SoftPoint = earn / spend (별도 운영)  
> **SSOT**: Company OS `ops/softblock/SOFT_FEATURE_OWNERSHIP_SSOT.md`  
> Path: `paypoint` folder · product SoftPoint · remote `minikwave/softpoint`

## Owns

- **리워드 · 크레딧** earn / spend · SoftPay SETTLED → earn webhook
- SoftPay checkout SP mix (loyalty) — SoftPG credit **아님**
- **Idempotency** body + `Idempotency-Key` header ([IDEMPOTENCY_CROSS_AUDIT.md](./IDEMPOTENCY_CROSS_AUDIT.md))

## Must NOT own

- SoftPG `pi_` / `rcpt_` · SoftPay connector-kit · SoftLedger Execute
- SoftAgent paid-tool PG

## Placement

```text
별도 운영: SoftMint · Stamana · SoftPoint
SoftPay SETTLED → SoftPoint earn · SoftPoint ≠ SoftPG
```

## FSM / audit (thin)

| Stage | Field |
|-------|-------|
| earn/payment | `order_id` · `Idempotency-Key`/`idempotency_key` · `payment_amount` (integer string) |
| earn/activity | `activity_slug` · header/body key |
| spend/redeem | header/body key · stored response replay |

## Honesty

`paper|mock|sandbox` · production earn rail / SSO = Human · SoftBlock GTM Visa Never · SoftLedger Execute Never

## Related

- [SOFT_STACK_BOUNDARY.md](./SOFT_STACK_BOUNDARY.md)
- [PAYPOINT_EARN_POLICY_AND_FLOW.md](./PAYPOINT_EARN_POLICY_AND_FLOW.md)
- [IDEMPOTENCY_CROSS_AUDIT.md](./IDEMPOTENCY_CROSS_AUDIT.md)
