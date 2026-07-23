# SoftPoint 연동 · 온보딩 · 온램프

## 1. 파트너가 SoftPoint를 쓰는 이유

자체 포인트 DB·정산·감사를 만들지 않고, **보상·로열티·캠페인**만 설계하면 됩니다. SoftPoint가 잔액 SSOT, 영수증, 정책, 운영 콘솔을 담당합니다.

## 2. 온램프 (비개발자 체크리스트)

1. **목적 정의** — 적립만 / 교환·기프티콘 / 스테이블 정산 포함 여부
2. **샌드박스** — API URL, 테스트 사용자 ID (예: `U1`)
3. **정책 합의** — 적립률, 1회·1일 한도 (`PAYMENT_EARN_POLICY` 등)
4. **키 발급** — `USER_JWT_SECRET`, `ADMIN_API_KEY` (프로덕션)
5. **파일럿** — 1건 지급 후 영수증·잔액 확인
6. **런칭** — 프로덕션 URL, 모니터링, 예외 큐 담당자

## 3. 개발자 연동 (최소 경로)

```http
GET  /health
GET  /v1/paypoint/balance/:user_id
POST /v1/paypoint/issue              # 캠페인·미션 보상
POST /v1/paypoint/earn/payment       # PG 결제 후 적립
POST /v1/paypoint/earn/activity      # Walk/광고 등 활동 적립
POST /v1/paypoint/spend              # SP 사용
GET  /v1/paypoint/credits/products
POST /v1/paypoint/credits/redeem     # 기프티콘
POST /v1/paypoint/conversion/request # 스테이블 정산 요청
```

### 사용자 매핑

- 파트너 `user_id` ↔ SoftPoint `user_id` (1:1 문자열)
- JWT 사용 시 `sub` = SoftPoint `user_id`

### 멱등

- 모든 POST에 `idempotency_key` 권장 (재시도 안전)

## 4. 활동형 적립 (`earn/activity`)

| slug | activity_type | 용도 |
|------|---------------|------|
| `payment-cashback` | PAYMENT | `/earn/payment` 또는 Spend 플로우 |
| `walk-to-earn` | WALK | 걸음 연동 후 `earn/activity` |
| `watch-ad` | AD_VIEW | 광고 완료 콜백 |
| `partner-stores` | PARTNER_STORE | 제휴 매장 (`/earn-locations`) |

## 5. 스테이블코인·상품권

- **기프티콘**: `credit_products` + `redeem` (MOCK → 실 공급사)
- **스테이블**: `conversion/request` → 운영 승인 → `tx_hash` (어댑터 로드맵)
- **마켓**: 교환·거래 API 확장 예정 (Phase 2)

## 6. 웹 UI 매핑

| URL | 대상 |
|-----|------|
| `/integrate` | 파트너 PM |
| `/onboarding` | 체크리스트 |
| `/developers` | API 레퍼런스 |
| `/app/home` | 소비자 홈 |
| `/app/earn` | 적립 허브 |

## 7. 배포

[DEPLOY.md](./DEPLOY.md) — Supabase · Railway · Vercel

## SoftPay 연계 (로열티)

SoftPay Pilot 결제 완료 후 SP를 적립합니다. SoftPG SoftAgent credit와는 별개입니다.

1. SoftPoint에 `SOFTPAY_WEBHOOK_SECRET` 설정 (SoftPay `WEBHOOK_SECRET`과 동일)
2. SoftPay webhook subscriber URL = SoftPoint `https://<api>/hooks/softpay`
3. 이벤트: `settlement.completed` (권장)
4. SDK pull: `earnFromSoftPaySettlement({ softpay_intent_id, ... })`
5. SoftPay Runtime opt-in: `SOFTPOINT_API_URL` → SETTLED 후 fail-open earn

문서: [SOFT_STACK_BOUNDARY.md](./SOFT_STACK_BOUNDARY.md)
