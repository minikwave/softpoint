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

- **랜딩** (`/`): 마케팅/진입 전용. 상단 디앱 네비게이션 없음. **디앱 들어가기** → `/app`, **가게 관리** → `/app/store`
- **디앱** (`/app/*`): 상단 메뉴(브랜드는 랜딩으로, **디앱** 라벨 표시) + 잔액, 내역, **적립 내역**, **적립 장소**, **디지털 상품권 스토어**, 결제, 정산 옵션, 가게

### 문서([PROJECT_ANALYSIS_AND_PLAN.md](./PROJECT_ANALYSIS_AND_PLAN.md)) 대비 구현 현황

| 구분 | 내용 |
|------|------|
| **구현됨 (MVP)** | Issue/Spend/Balance/Transactions(커서)·멱등, 전환 요청·조회·사용자 목록, Admin: 사용자 검색·계정·수동 적립·전환 승인/정산/실패, **`GET /v1/admin/audit-logs`**·콘솔 감사 로그, 전환 액션 감사 기록, 웹앱·오퍼레이터 콘솔 UI |
| **미구현·스텁** | API 인증·RBAC·2인 승인, 정책 draft/submit/activate API, 예외 큐, Conversion Router 실연동(DEX/CEX), `paypoint-worker`, Mobile 셸 |
| **데모 데이터** | 적립 장소 목록·지도 링크, 상품권 카탈로그(구매 시 Spend API는 실연동) |

- **가게** (`/app/store`): 가맹점 ID, 정산 요청, **실제 정산금 유입 과정**(REQUESTED → AUTHORIZED → SETTLED), 정산 현황·전환 목록(**정산 완료 시 tx_hash·settlement_ref 표시**)
- **관리자**: `pnpm dev:console` → http://localhost:5174 (사용자 검색, 수동 발급, 전환 승인/정산, **감사 로그**)
- **빌드**: `pnpm install && pnpm run build` (전체 검증 완료)

## Conversion (PayPoint → Stable)

- **사용자**: saum WebApp → "정산 옵션"에서 전환 요청 (MERCHANT_SETTLEMENT).
- **운영자**: Operator Console → "전환" 메뉴에서 요청 목록 조회, **승인**(잔액 예약) → **정산**(차감 확정) 또는 **실패**(예약 해제).
- 상태: `REQUESTED` → `AUTHORIZED`(예약) → `SETTLED`(확정) / `FAILED`.

## Docs

- [Project analysis & execution plan](./PROJECT_ANALYSIS_AND_PLAN.md)
- [PayPoint 적립 정책 및 결제 시 적립 기술 과정](./docs/PAYPOINT_EARN_POLICY_AND_FLOW.md)
- [PayPoint dev docs](./paypoint%20dev%20docs.txt)
