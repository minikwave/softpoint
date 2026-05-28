# PayPoint (saum) 프로젝트 분석 및 실행 계획

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

## 5. 구현 로드맵 (문서 기준)

| Phase | 내용 |
|-------|------|
| **Phase 0 (MVP)** | Engine: issue/spend/transactions · WebApp: balance/history/spend · Console: user search + issue · Conversion: merchant settlement 제한적 |
| **Phase 1** | Policy versioning, HOLD/Review 워크플로우, Conversion Router 고도화 |
| **Phase 2** | Mobile shell(푸시/바이오), fraud/risk 규칙, reporting pack |

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
- [ ] 모노레포 또는 단일 앱 선택 (예: pnpm workspace / npm workspaces)
- [ ] `apps/paypoint-api`, `packages/paypoint-domain` 디렉터리 생성
- [ ] 공통 타입/인터페이스 정의 (User, PayPointAccount, PayPointTransaction)
- [ ] DB 접근 레이어 선택 (예: Node + PostgreSQL, Prisma/Drizzle/TypeORM)

#### Step 2: 데이터베이스 스키마
- [ ] `paypoint_accounts` 테이블 (문서 15.1)
- [ ] `paypoint_transactions` 테이블 (문서 15.2)
- [ ] `paypoint_policies` 테이블 (문서 15.3)
- [ ] `paypoint_conversions` 테이블 (문서 7.1)
- [ ] `audit_logs` 테이블 (문서 15. Audit Log Spec)
- [ ] 마이그레이션 스크립트 및 초기 시드(필요 시)

#### Step 3: PayPoint Engine — 도메인 로직
- [ ] 도메인 불변식 검증 (balance, reserved_balance)
- [ ] Issue 로직 (balance 증가 + 트랜잭션 기록)
- [ ] Spend 로직 (SELECT FOR UPDATE + 트랜잭션, 잔액 차감, Receipt 생성 요청)
- [ ] GetBalance, GetTransactions
- [ ] Idempotency key 처리 (동일 키 시 기존 결과 반환)

#### Step 4: PayPoint API (REST)
- [ ] `POST /v1/paypoint/issue` (Body: user_id, amount, reason, expires_at)
- [ ] `POST /v1/paypoint/spend` (Body: user_id, amount, order_id, idempotency_key?)
- [ ] `GET /v1/paypoint/balance/{user_id}`
- [ ] `GET /v1/paypoint/transactions` (user_id, pagination)
- [ ] 인증/인가 퍼스트 (API Key 또는 JWT, user_id 매핑)
- [ ] 에러 포맷 통일 (4xx/5xx, 코드: INSUFFICIENT_BALANCE 등)

#### Step 5: Operator Console — 최소 기능
- [ ] 콘솔 전용 인증 (RBAC 기본: Super Admin, Ops Admin)
- [ ] `GET /v1/admin/users` (검색: user_id, status)
- [ ] `GET /v1/admin/accounts/{user_id}` (잔액, reserved, 타임라인)
- [ ] `POST /v1/admin/credits/issue` (수동 발급, audit_log 기록)
- [ ] 감사 로그: 모든 write 액션에 audit_log insert

#### Step 6: saum WebApp (사용자 UI)
- [ ] 잔액 표시 화면 (엔진 API 호출)
- [ ] 적립/사용 내역 목록 (transactions API)
- [ ] 결제(Spend) 플로우 UI (amount, order_id 입력 → spend API)
- [ ] (선택) 전환 요청 버튼 → `POST /v1/paypoint/conversion/request` 호출

#### Step 7: Conversion — 제한적 (Merchant Settlement)
- [ ] `paypoint_conversions` CRUD 및 상태: REQUESTED → AUTHORIZED → EXECUTING → SETTLED/FAILED
- [ ] `POST /v1/paypoint/conversion/request` (type=MERCHANT_SETTLEMENT 위주)
- [ ] AUTHORIZED 시 reserved_balance 증가, FAILED 시 해제
- [ ] (선택) Conversion Router 스텁: 실제 DEX/CEX/OTC 없이 상태만 전이

#### Step 8: 보안 및 운영 기본
- [ ] Idempotency key 강제 (spend, issue 등)
- [ ] DB 트랜잭션 격리 수준 확인 (REPEATABLE READ 이상)
- [ ] 감사 로그 조회 API (Console용)
- [ ] 환경 변수: DB URL, API 키, (선택) JWT secret

---

### Phase 1 (MVP 이후)
- Policy 버전 관리 및 정책 배포 워크플로우 (DRAFT → REVIEW → PUBLISHED → ACTIVE)
- HOLD/Review 워크플로우 (리스크 플래그 시 보류)
- Conversion Router 실라우팅 (Quote Engine, DEX/CEX/OTC 어댑터)
- Console: Policies 화면, Campaign 대량 발급, Exceptions 큐

### Phase 2
- Mobile Shell (WebView + 푸시, 디바이스 바인딩)
- Fraud/Risk 규칙 엔진
- 리포팅 팩 (일/주/월 GMV, 정산 내보내기)

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

- [ ] **엔진**이 잔액·정책·Receipt의 SSOT임을 코드 구조로 유지
- [ ] **WebApp/Console**은 엔진 API만 호출
- [ ] **Spend**는 반드시 트랜잭션 + row lock으로 이중 사용 방지
- [ ] **전환**은 정산 옵션으로만 노출, 자산 스왑 UI 지양
- [ ] **Operator Console** 모든 write는 AuditLog 기록
- [ ] **Conversion** 실패 시 reserved 해제, SETTLED 시 확정 차감

이 문서를 기준으로 **Step 1(프로젝트 셋업 및 구조)**부터 순서대로 진행하면 PayPoint(saum) MVP를 안전하게 구현할 수 있습니다.
