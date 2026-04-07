# PayPoint (saum) 프로젝트 분석 및 실행 계획

> **구현 진행도**: Phase 0 Step 체크리스트는 **실제 코드 기준으로 갱신**되어 있습니다. 남은 작업·머지·쌓음(saum)·마켓 확장은 **§10 남은 투두 및 확장 로드맵**을 참고하세요. 한 줄 요약은 [README.md](./README.md)의 「문서 대비 구현 현황」「제품 관점: 머지(통합)와 쌓음(saum)」을 참고하세요. **브랜드 전제: 쌓음(saum)** — [docs/PRODUCT_NAMING.md](./docs/PRODUCT_NAMING.md).

## 1. 프로젝트 정의

### 1.1 무엇을 만드는가
**PayPoint(saum)**는 Pay Worlds **Payment Layer**의 **Application Credit Abstraction Layer**이다.

- **자산/증권/담보/스테이블코인이 아님** → **소비용 크레딧 단위**
- 선불 크레딧 관리, 적립/사용, 바우처·상품권, 가맹점 리워드, 정책 기반 소비 제한
- **Settlement Layer와 분리**: 정산·유동성·리저브를 직접 운용하지 않음

### 1.2 핵심 원칙
| 원칙 | 설명 |
|------|------|
| SSOT | PayPoint Engine이 잔액·정책·Receipt의 단일 진실(SSOT) |
| 분리 | UI(Web/Mobile/Console)는 엔진 API만 호출, DB 직접 접근 금지 |
| 전환 | PayPoint ↔ Stablecoin 전환은 Back-end 라우팅/실행 기능 (UI가 아님) |

---

## 2. 시스템 구조 (4개 컴포넌트)

```
[PayPoint Engine]  ← SSOT (Credits, Policy, Receipts)
      ↑     ↑
      |     |
[saum WebApp/Mobile]    [Operator Console]
(사용자 UI)              (운영/정책/리포트)

[Conversion Router]  ← PayPoint ↔ Stablecoin 전환 실행
```

| 컴포넌트 | 역할 |
|----------|------|
| **PayPoint Engine** | 계정/잔액, Issue/Spend/Expire/Reverse, 정책 평가, Receipt 생성·Settlement 연동 |
| **saum WebApp** | 잔액·내역·결제 플로우, 전환 요청 UI (실행은 엔진/라우터) |
| **saum Mobile** | WebView 기반 셸 + 푸시·디바이스 바인딩·QR 등 최소 네이티브 |
| **Operator Console** | 정책·예외·감사, RBAC, 2인 승인, 리포팅 |
| **Conversion Router** | PayPoint → Stable 전환 실행 (DEX/CEX/OTC 라우팅) |

---

## 3. 데이터 모델 요약

### 3.1 핵심 엔티티
- **User** – user_id, wallet_address?, status
- **PayPointAccount** – account_id, user_id, balance, reserved_balance, status
- **PayPointTransaction** – tx_id, account_id, type(ISSUE/SPEND/EXPIRE/ADJUST), amount, receipt_id?, metadata
- **PayPointPolicy** – policy_id, version, policy_json, effective_from
- **PayPointConversion** – conversion_id, user_id, type, from_amount, to_asset, status, quote, tx_hash
- **AuditLog** – actor_id, action, target_type, target_id, before/after JSONB

### 3.2 크레딧 생명주기
`ISSUED → HELD(ACTIVE) → [RESERVE] → SPENT → SETTLED` 또는 `ACTIVE → EXPIRED` / `ADJUSTED`

### 3.3 불변식 (Engine)
- `balance >= 0`, `reserved_balance >= 0`, `balance - reserved_balance >= 0`
- Spend: **SELECT FOR UPDATE + DB 트랜잭션** 필수 (이중 사용 방지)

---

## 4. API 요약

### 4.1 사용자 (Web/Mobile)
- `GET /v1/paypoint/balance` (또는 `.../balance/{user_id}`)
- `GET /v1/paypoint/transactions`
- `POST /v1/paypoint/spend`
- `POST /v1/paypoint/conversion/request`
- `GET /v1/paypoint/conversion/{id}`

### 4.2 운영자 (Console)
- 정책: `POST /v1/admin/policies/draft`, `.../submit`, `.../approve`, `.../activate`
- 크레딧: `POST /v1/admin/credits/issue`, `.../adjust`, `.../campaigns/*`
- 전환: `GET /v1/admin/conversions`, `POST .../approve`, `.../retry`
- 예외: `GET /v1/admin/exceptions`, `POST .../resolve`

---

## 5. 구현 로드맵 (개정)

| Phase | 내용 | 상태(요약) |
|-------|------|------------|
| **Phase 0 (MVP)** | Engine issue/spend/balance/transactions·멱등, conversion 요청·Admin 승인/정산/실패, WebApp 랜딩/디앱·가게, Console 사용자·전환·감사 로그, 선택 `ADMIN_API_KEY`, `GET /health` | **대부분 완료** (§7 참고) |
| **Phase 0+ (마감·하드닝)** | ~~conversion/request 멱등~~ **완료**; ~~사용자 API JWT(`USER_JWT_SECRET`, HS256·`sub`)~~ **완료**; Spend/Issue 멱등 정책 문서화, DB 격리 수준 운영 가이드, Admin write 감사 누락 점검 | **부분 완료** |
| **Phase 1a — 머지·쌓음(saum) UX** | 멀티 소스 `issue` 연동(어댑터는 별도 서비스), 트랜잭션 `source`/메타 표준, 디앱 적립·내역 출처 표시·필터, EarnMap/가맹 API 연동 | **대부분 완료** (§10.2·§7) |
| **Phase 1b — 정책·예외** | Policy draft/submit/activate API, 평가 엔진·버전 활성화, HOLD/Review, Exceptions 큐 | **대부분 완료** (§10.3) |
| **Phase 1c — 전환** | Conversion Router 실연동(Quote, DEX/CEX/OTC), EXECUTING 단계 자동화 | **계획** |
| **Phase 1d — 쌓음(saum) 포인트앱형 허브 UX** | 한 화면에서 잔액·사용처·사용/적립 내역·추가 적립 경로(벤치마크: 주요 포인트 앱) | **계획** (§10.8 `UX-*`) |
| **Phase 2 — 마켓·상품권·선불** | 카탈로그/재고/멀티 머천트, **포인트 상품권(액면 vs 할인 구매)**, PCI 등 **충전→Spend**, 바우처·정산 | **계획** (§10.5–10.6) |
| **Phase 2b — 디지털 수집품** | PayPoint로 수집품 구매, 소유권·2차 수요자 혜택·에어드롭/리딤 파이프 | **계획** (§10.6 `DC-*`) |
| **Phase 3 — Mobile·리스크·리포트** | Mobile WebView 셸, 푸시·바이오, fraud/risk 규칙, `paypoint-worker` 만료·리포트 팩 | **계획** |
| **Phase 4 (온체인 UX, 선택)** | 디앱 지갑 연결·네트워크 선택, 온체인 잔액 읽기(표시만 또는 입금 증빙) | **선택·장기** |
| **Phase 4b — 메신저·채널** | 텔레그램 봇/미니앱·알림·딥링크; 카카오톡은 **장기·정책 검토 후** (당분간 비우선) | **계획** (§10.9 `MSG-*`) |

---

## 6. 권장 레포/디렉터리 구조 (문서 13.1 기준)

```
apps/
  paypoint-api/        # REST API (사용자 + Admin)
  paypoint-worker/     # 만료 배치, 리스크 감지, 대량 발급, 리포트
packages/
  paypoint-domain/     # 잔액/정책/상태 전이/불변식
  paypoint-policy/     # 정책 평가 엔진
  paypoint-sdk/        # (선택) 클라이언트 SDK
```

Conversion Router는 별도 서비스 또는 `apps/conversion-router/` 로 분리 권장.

---

## 7. 단계별 실행 계획 (Todo 및 순서)

### Phase 0 — MVP

#### Step 1: 프로젝트 셋업 및 구조 생성
- [x] 모노레포 또는 단일 앱 선택 (예: pnpm workspace / npm workspaces)
- [x] `apps/paypoint-api`, `packages/paypoint-domain` 디렉터리 생성
- [x] 공통 타입/인터페이스 정의 (User, PayPointAccount, PayPointTransaction)
- [x] DB 접근 레이어 선택 (예: Node + PostgreSQL, Prisma/Drizzle/TypeORM)

#### Step 2: 데이터베이스 스키마
- [x] `paypoint_accounts` 테이블 (문서 15.1)
- [x] `paypoint_transactions` 테이블 (문서 15.2)
- [x] `paypoint_policies` 테이블 (문서 15.3)
- [x] `paypoint_conversions` 테이블 (문서 7.1)
- [x] `audit_logs` 테이블 (문서 15. Audit Log Spec)
- [x] 마이그레이션 스크립트 및 초기 시드(필요 시) — Prisma `db:push` / migrate

#### Step 3: PayPoint Engine — 도메인 로직
- [x] 도메인 불변식 검증 (balance, reserved_balance)
- [x] Issue 로직 (balance 증가 + 트랜잭션 기록)
- [x] Spend 로직 (SELECT FOR UPDATE + 트랜잭션, 잔액 차감, Receipt 생성 요청)
- [x] GetBalance, GetTransactions
- [x] Idempotency key 처리 (동일 키 시 기존 결과 반환) — spend 기본 키, issue/admin issue 선택 키

#### Step 4: PayPoint API (REST)
- [x] `POST /v1/paypoint/issue` (Body: user_id, amount, reason, expires_at, idempotency_key?)
- [x] `POST /v1/paypoint/spend` (Body: user_id, amount, order_id, idempotency_key?)
- [x] `GET /v1/paypoint/balance/{user_id}`
- [x] `GET /v1/paypoint/transactions` (user_id, pagination)
- [x] 인증/인가 퍼스트 (API Key 또는 JWT, user_id 매핑) — **사용자 `/v1/paypoint/*`**: 선택 `USER_JWT_SECRET` + Bearer JWT(`sub`); Admin은 선택 `ADMIN_API_KEY`
- [x] 에러 포맷 통일 (4xx/5xx, 코드: INSUFFICIENT_BALANCE 등) — 주요 경로

#### Step 5: Operator Console — 최소 기능
- [ ] 콘솔 전용 인증 (RBAC 기본: Super Admin, Ops Admin) — **Admin API 키만 선택 적용, RBAC 없음**
- [x] `GET /v1/admin/users` (검색: user_id, status)
- [x] `GET /v1/admin/accounts/{user_id}` (잔액, reserved, 타임라인)
- [x] `POST /v1/admin/credits/issue` (수동 발급, audit_log 기록)
- [x] 감사 로그: 주요 write에 audit (수동 적립, 전환 승인/정산/실패); **전 항목·2인 승인은 미구현**

#### Step 6: saum WebApp (사용자 UI)
- [x] 잔액 표시 화면 (엔진 API 호출)
- [x] 적립/사용 내역 목록 (transactions API)
- [x] 결제(Spend) 플로우 UI (amount, order_id 입력 → spend API)
- [x] 전환 요청 → `POST /v1/paypoint/conversion/request` (정산 옵션, 가게)
- [x] 랜딩/디앱 분리, 적립 내역·상품권(데모)·적립 장소(데모) 등 확장 화면

#### Step 7: Conversion — 제한적 (Merchant Settlement)
- [x] `paypoint_conversions` 및 상태: REQUESTED → AUTHORIZED → SETTLED/FAILED (MVP)
- [x] `POST /v1/paypoint/conversion/request` (type=MERCHANT_SETTLEMENT 위주)
- [x] AUTHORIZED 시 reserved_balance 증가, FAILED 시 해제, SETTLED 시 차감
- [x] Conversion Router 스텁: 실제 DEX/CEX 없이 상태·필드(tx_hash 등)만 관리

#### Step 8: 보안 및 운영 기본
- [x] 멱등 키 **필수/선택·동작** 문서화 — README 「멱등 키 운영 가이드」 (issue/admin issue 선택, spend 암묵 키, conversion 선택 키)
- [ ] Idempotency key **강제**(모든 쓰기 필수 키) — 현재는 설계상 **선택**(spend는 `order_id` 기반 기본 키)
- [ ] **은행·온체인·PCI 잔고 대사/모니터링** — 레포 내 **미구현**([docs/MVP_REMAINING_AND_RECONCILIATION.md](./docs/MVP_REMAINING_AND_RECONCILIATION.md) §3); `paypoint-worker`/메트릭 없음
- [x] DB 트랜잭션·행 락 운영 가이드 — [docs/POSTGRES_TRANSACTION_OPS.md](./docs/POSTGRES_TRANSACTION_OPS.md)
- [x] 감사 로그 조회 API (Console용) — `GET /v1/admin/audit-logs`
- [x] 환경 변수: DB URL, API 키, (선택) JWT secret — `.env.example` + `ADMIN_API_KEY`, `GET /health`

---

### Phase 1~3와 §5·§10의 대응

과거 "Phase 1 (MVP 이후) / Phase 2"에 있던 Policy·Router·Console Policies·Mobile·Fraud·리포트 항목은 **§5 구현 로드맵(개정)** 표와 **§10 남은 투두** 표(ID: P0-*, M1-*, B1-*, C1-*, MP-*, W1-*)로 옮겨 추적한다.

---

## 8. 기술 스택 제안 (선택)

| 영역 | 제안 |
|------|------|
| 런타임 | Node.js 20+ (또는 Bun) |
| API | Express / Fastify / NestJS |
| DB | PostgreSQL 15+ |
| ORM/쿼리 | Prisma 또는 Drizzle (타입 안전 + 마이그레이션) |
| WebApp | React + Vite (또는 Next.js) |
| Console | React + Vite (Admin 라우트 분리 또는 별도 앱) |
| 인증 | JWT + API Key (Console), 세션 또는 JWT (WebApp) |

---

## 9. 요약 체크리스트

- [x] **엔진**이 잔액·정책·Receipt의 SSOT임을 코드 구조로 유지
- [x] **WebApp/Console**은 엔진 API만 호출
- [x] **Spend**는 반드시 트랜잭션 + row lock으로 이중 사용 방지
- [x] **전환**은 정산 옵션으로만 노출, 자산 스왑 UI 지양
- [x] **Operator Console** Admin write는 AuditLog 기록 — 수동 적립·전환 승인/정산/실패 (`before`/`after` 포함)
- [x] **Conversion** 실패 시 reserved 해제, SETTLED 시 확정 차감

---

## 10. 남은 투두 및 확장 로드맵 (제품 검토·머지·쌓음(saum)·마켓 반영)

아래는 README 「제품 관점: 머지(통합)와 쌓음(saum)」에서 정리한 갭과, Phase 0+ 이후 작업을 **실행 가능한 투두**로 묶은 것이다. **포인트 상품권(선불 할인)**, **PCI 충전→수집품 Spend**, **수요자 리워드**, **포인트앱형 정보 허브**, **메신저(텔레그램 우선)** 는 §10.5–10.9에 반영했다. 우선순위는 팀에서 조정한다.

### 10.1 Phase 0+ (마감·하드닝)

| # | 투두 | 비고 |
|---|------|------|
| P0-1 | 사용자 `/v1/paypoint/*` 인증 (JWT/세션 + user_id 매핑) | **완료**: `USER_JWT_SECRET` 시 Bearer HS256, `sub` ↔ `user_id` 일치 검사; 웹앱 `VITE_USER_JWT` / `localStorage.paypoint_jwt` |
| P0-2 | `POST /v1/paypoint/conversion/request` 멱등 키 | **완료**: `idempotency_key` 또는 `client_request_id`(→ `conversion:{user_id}:{id}`); 재요청 시 **200** + 동일 본문 |
| P0-3 | 멱등·스킴 운영 가이드 (필수/선택 구분) 문서 | **완료**: README 표 + Step 8 체크; 강제 키 정책은 미적용(별도 결정) |
| P0-4 | PostgreSQL 트랜잭션 격리·락 운영 메모 | **완료**: [docs/POSTGRES_TRANSACTION_OPS.md](./docs/POSTGRES_TRANSACTION_OPS.md) + README 링크 |
| P0-5 | Admin 나머지 write 감사 누락 점검 | **완료**: 전환·수동 적립 모두 `before`/`after`; Admin 쓰기 경로는 감사 정합 |

### 10.2 Phase 1a — 머지(통합)·쌓음(saum) 제품층

| # | 투두 | 비고 |
|---|------|------|
| M1-1 | `ISSUE` 유입용 **소스 표준 메타** (예: `source`, `external_ref`, `campaign_id`) 스키마·API 계약 | **완료**: `POST /issue`·`POST /admin/credits/issue`·Engine metadata; 디앱·콘솔 타임라인 출처 열 |
| M1-2 | **온체인/오프체인 어댑터** (별도 서비스 권장): 이벤트 수신 → Engine `issue` | 레포 외부 배치 가능 |
| M1-3 | 디앱 **적립·전체 내역**에 출처 표시·필터 | **완료**: 표시 + `GET /transactions?source=&type=` 및 디앱 적용/초기화 UI |
| M1-4 | **EarnMap / 가맹 목록** 백엔드 API + 프론트 목업 제거 | **완료**: `paypoint_earn_locations`, `GET /earn-locations`, `db:seed`, 디앱 API 연동·카테고리 필터 |
| M1-5 | (선택) 디앱 **지갑 연결·체인 선택** UI | **완료**: `/app/wallet` 데모 주소·localStorage, 체인 선택(표시용) |

### 10.3 Phase 1b — 정책·예외

| # | 투두 | 비고 |
|---|------|------|
| B1-1 | `POST /v1/admin/policies/draft|submit|approve|activate` | **완료**: `GET /policies`, DB `status`·타임스탬프, 감사 로그, 콘솔 정책 화면 |
| B1-2 | 결제 시 적립 등 **정책 평가 엔진** 연동 | **완료(MVP)**: Spend 내 `PAYMENT_EARN_POLICY` ACTIVE + `@paypoint/domain` 퍼센트 계산; 티어·전용 `paypoint-policy` 패키지는 미구현 |
| B1-3 | `GET/POST /v1/admin/exceptions` 큐 | **완료**: `paypoint_exceptions`, resolve·감사, 자동 엔진 연동은 별도 |
| B1-4 | Console **Policies·Exceptions** 화면 | **완료** |

### 10.4 Phase 1c — 전환·라우터

| # | 투두 | 비고 |
|---|------|------|
| C1-1 | Conversion **Quote** API·상태 `QUOTED` | |
| C1-2 | Router **DEX/CEX/OTC** 어댑터·`EXECUTING` 자동화 | 별도 `conversion-router` 앱 권장 |
| C1-3 | Console **retry**·실패 알림 | |

### 10.5 Phase 2 — 상품권·선불·마켓플레이스

| # | 투두 | 비고 |
|---|------|------|
| MP-1 | **상품권** 카탈로그 API, 재고, 발급 코드/바우처 엔티티 | 현재 목업 대체 |
| MP-2 | **마켓플레이스**: 카탈로그 검색, 멀티 머천트, 장바구니/주문 | |
| MP-3 | 주문 **Spend 멱등**·머천트 정산 분배 모델 | |
| MP-4 | 제휴사 정산·환불 정책 | |
| **PG-1** | **포인트 상품권(선불 할인)** 상품 타입 — 예: 액면 **3만 PP**를 **현금 2.7만원** 등에 판매 | 액면·판매가·유효기간·회계(선수금/이연)·사용 시 `issue` 또는 바우처 리딤; PG-2·MP-1과 스키마 정합 |
| **PG-2** | 상품권·충전 **마진·정산**(플랫폼·발행사·PG 수수료) | MP-4·재무 리포트와 연계 |
| **PG-3** | **PCI/카드 등 법정 결제**로 PayPoint **충전**(top-up) API·웹훅·감사 | 내부 충전 후 Spend·수집품 구매 E2E; PCI 범위·토큰화는 별도 준수 |

### 10.6 Phase 2b — 디지털 수집품·2차 수요

| # | 투두 | 비고 |
|---|------|------|
| **DC-1** | **디지털 수집품** 카탈로그·재고·`Spend` 구매, 메타데이터·소유 기록 | NFT 온체인은 선택; 엔진은 PP 잔액·거래 SSOT |
| **DC-2** | 보유자 → **추후 수요자**에게 혜택(에어드롭·리딤·쿠폰) **큐/worker** | 스냅샷·자격 규칙·감사; 커뮤니티/마켓 수요와 연동 |
| **DC-3** | 수집품 구매 후 **풀필먼트**(파일·링크·오프체인 권리) | DC-1 메타와 배송 채널 |

### 10.7 Phase 3 — Mobile·Worker·리스크·리포트

| # | 투두 | 비고 |
|---|------|------|
| W1-1 | `apps/paypoint-worker` 만료 배치·대량 발급·리포트 | §6 구조; DC-2·상품권 만료와 공유 |
| W1-2 | Mobile WebView 셸·푸시·QR | |
| W1-3 | Fraud/Risk 규칙·리포팅 팩 (GMV, 정산 export) | |

### 10.8 Phase 1d — 포인트앱형 허브·정보 UX

| # | 투두 | 비고 |
|---|------|------|
| **UX-1** | 디앱 **허브 홈**: 잔액 요약, **사용처** 진입, 최근 사용·적립, **추가 적립** CTA 한 화면 | 벤치마크: 국내 포인트 앱(잔액/쓰는 곳/내역/미션); `/app` 진입 개편 또는 `/app/home` |
| **UX-2** | **사용처** 통합 뷰 — 가맹(EarnMap)·온라인·수집품·상품권을 카테고리/지도/리스트로 | M1-4·MP-2·DC-1과 API 연동 |
| **UX-3** | **내역** 고도화 — 통합 타임라인, 검색, 영수증/주문 상세, 필터 프리셋 | `GET /transactions` 확장·클라이언트 캐시 |
| **UX-4** | **적립 미션·챌린지** 목록(정책/캠페인 메타 기반) | M1-2·운영 캠페인과 연계 |

### 10.9 Phase 4b — 메신저·채널 연동

| # | 투두 | 비고 |
|---|------|------|
| **MSG-1** | **텔레그램** — 봇 또는 WebApp: 잔액·알림·거래 요약·디앱 딥링크 | OAuth/링크 계정·webhook; 읽기 위주 MVP → 알림 확대 |
| **MSG-2** | **기타 메신저**(Discord 등) — 동일 패턴 검토 | 우선순위 낮음 시 backlog |
| **MSG-3** | **카카오톡**(채널·알림톡·비즈니스 정책) | **장기·당분간 비우선**; 심사·비용·개인정보 정책 확정 후 착수 |

### 10.10 로드맵과의 매핑

| §5 Phase | §10 섹션 |
|----------|-----------|
| Phase 0+ | §10.1 |
| Phase 1a | §10.2 |
| Phase 1b | §10.3 |
| Phase 1c | §10.4 |
| Phase 1d | §10.8 (`UX-*`) |
| Phase 2 | §10.5 (`MP-*`, `PG-*`) |
| Phase 2b | §10.6 (`DC-*`) |
| Phase 3 | §10.7 (`W1-*`) |
| Phase 4 | §10.2 M1-5 등 |
| Phase 4b | §10.9 (`MSG-*`) |

---

이 문서는 **Phase 0는 대부분 완료**된 상태를 전제로 하며, **§10**부터 순서대로 백로그를 잡으면 머지·쌓음(saum)·마켓·선불 상품권·수집품·포인트앱형 UX·메신저까지 제품 요구를 체계적으로 반영할 수 있습니다.
