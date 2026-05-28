# PayPoint(saum) 로드맵 — dev docs 2 기준

**기준**: `paypoint dev docs 2.txt`, 레포 실구현 스냅샷 (2026-05).

## 현재 위치

- **있음**: 크레딧 계정·Issue/Spend·전환·정책 워크플로·예외 큐·적립 장소·결제 적립(`paymentEarn`)·소비자/가게 UI·운영 API(대부분).
- **없음/약함**: Ledger/Receipt SSOT, CreditProduct/Redemption, EventOutbox, Worker, 대사·Reserve, 자동 테스트, JWT/Admin 훅(Phase A에서 보강), 콘솔 화면 일부 미연결(Phase A에서 보강).

## v1 정의 (dev docs 2 §15)

> 적립·사용·교환을 원장·영수증·정책·감사로 추적하는 Programmable Credit MVP

**제품 정체성**: 포인트/크레딧/교환 (지갑·거래소·스왑 UI 금지). 스테이블·AI는 Adapter·내부 레일.

## 단계별 태스크

### Phase B/C — Ledger·Receipt·교환 (2026-05 2차 완료)

| ID | 내용 | 상태 |
|----|------|------|
| B1–B5 | LedgerEntry, Receipt, ReceiptEvent + issue/spend/redeem 경유 | 완료 |
| B6–B8 | Receipt API, WebApp ReceiptDetail, Console Receipts | 완료 |
| C1–C5 | CreditProduct/Redemption, credits API, VoucherStore redeem, 시드 | 완료 |
| D1–D2 | Admin Dashboard, Reserve 스냅샷 API·화면 | 완료 |

### Phase A — 정합·운영 기반 (2026-05 1차 완료)

| ID | 내용 | 상태 |
|----|------|------|
| A1 | 문서·OpenAPI·실코드 정합 | 부분 (`ROADMAP` 추가) |
| A2 | operator-console: 정책·예외·감사 라우트 | 완료 |
| A3 | API: `ADMIN_API_KEY` / `USER_JWT_SECRET` 훅 | 완료 |
| A4 | `/metrics`, `x-request-id` | 완료 |
| A5 | transactions `metadata` + `source` 필터 | 완료 |
| A6 | domain `paymentEarn` 단위 테스트 | 완료 |

### Phase B — Ledger + Receipt (T1–T8)

Prisma `LedgerEntry`, `Receipt`, `ReceiptEvent` → `ledger.ts` / `receipt.ts` → Issue/Spend/earn 경유 → Receipt API·화면.

### Phase C — 교환 v1 데모 (T9–T13)

`CreditProduct`, `CreditRedemption`, `/v1/credits/*`, Store→redeem, Console Products/Redemptions.

### Phase D — 운영 마감

Dashboard, Reserve 스냅샷, Merchant 연동, 멱등 강제, RBAC 최소.

### Phase E — v1.5~v2 (T14–T21)

EventOutbox, SettlementAdapter, AgentBudget, reconciliation-worker, merchant-console.

## v1 데모 시나리오 (§38)

10,000P → 5,000P 기프티콘 redeem → Receipt/Ledger → My Credits → Console Receipts → Reserve 감소 확인.

## 참고

- [PAYPOINT_EARN_POLICY_AND_FLOW.md](./PAYPOINT_EARN_POLICY_AND_FLOW.md)
- [MVP_REMAINING_AND_RECONCILIATION.md](./MVP_REMAINING_AND_RECONCILIATION.md)
- [CURRENT_STATE_UX_AND_FUTURE_FLOWS.md](./CURRENT_STATE_UX_AND_FUTURE_FLOWS.md)
