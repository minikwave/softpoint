# PayPoint (saum)

Application Credit Abstraction Layer — Pay Worlds Payment Layer.

- **Engine**: Credits, policy, receipts (SSOT)
- **WebApp / Mobile**: User UI (balance, history, spend)
- **Operator Console**: Policy, exceptions, audit
- **Conversion Router**: PayPoint ↔ Stablecoin (separate)

## Structure

```
apps/
  paypoint-api/       # REST API (Engine + Admin)
  saum-webapp/        # User Web UI (balance, history, spend)
  operator-console/   # Operator Console (user search, manual issue)
packages/
  paypoint-domain/    # Types & invariants
```

## Setup

```bash
pnpm install
cp .env.example .env   # set DATABASE_URL
pnpm db:push           # create DB tables
pnpm dev               # run API (http://localhost:3000)
pnpm dev:webapp        # run WebApp (http://localhost:5173, proxies /v1 to API)
pnpm dev:console       # run Operator Console (http://localhost:5174)
```

## 랜딩 및 디앱

- **랜딩** (`/`): "쌓음" 타이틀, **디앱 들어가기** → `/app`, **가게 관리** → `/app/store`
- **디앱** (`/app`): 잔액, 내역, **적립 내역**, **적립 장소 지도**, **디지털 상품권 스토어**, 결제, 정산 옵션, 가게 (모두 PayPoint 엔진 API 연동)
- **가게** (`/app/store`): 가맹점 ID, 정산 요청, **실제 정산금 유입 과정**(REQUESTED → AUTHORIZED → SETTLED), 정산 현황·전환 목록(**정산 완료 시 tx_hash·settlement_ref 표시**)
- **관리자**: `pnpm dev:console` → http://localhost:5174 (사용자 검색, 수동 발급, 전환 승인/정산)
- **빌드**: `pnpm install && pnpm run build` (전체 검증 완료)

## Conversion (PayPoint → Stable)

- **사용자**: saum WebApp → "정산 옵션"에서 전환 요청 (MERCHANT_SETTLEMENT).
- **운영자**: Operator Console → "전환" 메뉴에서 요청 목록 조회, **승인**(잔액 예약) → **정산**(차감 확정) 또는 **실패**(예약 해제).
- 상태: `REQUESTED` → `AUTHORIZED`(예약) → `SETTLED`(확정) / `FAILED`.

## Docs

- [Project analysis & execution plan](./PROJECT_ANALYSIS_AND_PLAN.md)
- [PayPoint 적립 정책 및 결제 시 적립 기술 과정](./docs/PAYPOINT_EARN_POLICY_AND_FLOW.md)
- [PayPoint dev docs](./paypoint%20dev%20docs.txt)
