# SoftPoint 로드맵 (2026-05 갱신)

**기준**: `minikwave/softpoint` 레포, Supabase `cjqykyeqhoqlxnuzuatu`, Railway API, Vercel `softpoint-web`.

## 제품 정체성

**SoftPoint** — 다른 프로덕트에 붙는 **보상·인센티브 크레딧 레이어**. 지갑·거래소 UI가 아니라 발행·적립·사용·교환·정산을 API·영수증·정책으로 추적합니다.

포인트 단위: **SP**. API surface: `/v1/paypoint/*` (안정적 통합 경로).

## 제품·기술 특장점 (현재)

| 특장점 | 설명 |
|--------|------|
| **임베드형 보상** | 파트너 앱에 `issue` / `earn` API만 연결해 미션·구매·광고 보상 |
| **Ledger + Receipt SSOT** | 모든 쓰기가 영수증·원장으로 추적 — 운영·감사·정산 가능 |
| **정책 기반 적립** | `PAYMENT_EARN_POLICY` + 활동 카탈로그 (`earn-activities`) |
| **마케팅 ↔ D-App 분리** | B2B 연동 스토리(랜딩·온보딩)와 소비자 UX 분리 |
| **한·영 i18n** | 마케팅·D-App 전 페이지 ko/en, 비개발자 친화 카피 |
| **디자인 시스템 v1** | 토큰·공통 컴포넌트·모바일 하단 네비 |

## 현재 위치 (완료)

### 인프라·브랜드
- [x] 독립 레포 `minikwave/softpoint`, saum/PayPoint UI 브랜드 제거
- [x] Supabase 스키마·시드·`earn_activities`
- [x] Railway API + Vercel 웹 (연동 문서: `docs/DEPLOY.md`)

### API (softpoint-api)
- [x] 계정, Issue/Spend, Ledger+Receipt, 결제 적립, 상품 교환, 전환
- [x] Admin API, JWT/Admin 키, `/metrics`, `x-request-id`
- [x] `GET/POST /v1/paypoint/earn-activities`

### 웹 (softpoint-web)
- [x] 마케팅: `/`, `/product`, `/integrate`, `/onboarding`, `/developers`
- [x] D-App: 홈·모으기·쇼핑·결제·더보기 + 하단 네비(모바일)
- [x] i18n 전 페이지, 디자인 시스템, 마케팅 푸터
- [x] 포인트 마켓 데모 UI (`/app/market`)

### 도메인·문서
- [x] `@softpoint/domain`, `SOFTPOINT_PRODUCT_VISION.md`, `INTEGRATION_ONBOARDING.md`
- [x] `@softpoint/sdk` — User + Admin TypeScript 클라이언트, 웹·콘솔 연동
- [x] `docs/INTEGRATION_SDK.md`, `scripts/smoke-api.mjs`

### API 확장 (2026-06)
- [x] `GET /v1/paypoint/info` — SDK discovery
- [x] `GET /v1/paypoint/market/listings` — 마켓 데모 데이터

## 남은 투두

### P0 — 프로덕션 안정화
| ID | 내용 | 상태 |
|----|------|------|
| P0-1 | Railway `DATABASE_URL` → Supabase 프로덕션 URI | 확인 필요 |
| P0-2 | `/health`, balance, redeem E2E 스모크 | 확인 필요 |
| P0-3 | 구 Vercel/Railway/Supabase 레거시 리소스 정리 | 수동 |

### P1 — 제품 완성도
| ID | 내용 | 상태 |
|----|------|------|
| P1-1 | EarnMap·EarnActivity 실 SDK 연동 (Walk/광고) | 미구현 |
| P1-2 | 파트너 샌드박스 키·셀프서비스 온보딩 | 미구현 |
| P1-3 | operator-console SoftPoint 브랜딩·Vercel 배포 | SDK 연동 완료, 배포 미완 |
| P1-4 | 마켓플레이스 실 거래·에스크로 API | 데모 listings API + UI |
| P1-5 | OpenAPI 전면 동기화 + npm publish SDK | 부분 (SDK 패키지 완료) |

### Phase E — v1.5~v2 (백로그)
| ID | 내용 |
|----|------|
| E1 | EventOutbox + 비동기 워커 |
| E2 | SettlementAdapter (온체인·PG) |
| E3 | reconciliation-worker, Reserve 자동 대사 |
| E4 | merchant-console, RBAC |
| E5 | 포인트 마켓 P2P·재고 연동 |

## v1 데모 시나리오

1. U1 잔액 조회 → 2. 기프티콘 redeem → 3. 영수증·내역 확인 → 4. Console에서 Receipt/Reserve 확인 → 5. (선택) 스테이블 전환 요청

## 참고

- [SOFTPOINT_PRODUCT_VISION.md](./SOFTPOINT_PRODUCT_VISION.md)
- [INTEGRATION_ONBOARDING.md](./INTEGRATION_ONBOARDING.md)
- [DEPLOY.md](./DEPLOY.md)
- [PRODUCT_NAMING.md](./PRODUCT_NAMING.md)
