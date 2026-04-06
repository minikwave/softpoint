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

### 운영·보안 (선택)

- **`GET /health`** — API 생존 확인 (인증 없음).
- **`ADMIN_API_KEY`** — 루트 `.env`에 설정 시 모든 `/v1/admin/*` 요청에 `x-admin-api-key: <값>` 또는 `Authorization: Bearer <값>` 필요. 비우면 로컬 개발처럼 Admin이 열려 있음.
- **`USER_JWT_SECRET`** — 설정 시 모든 `/v1/paypoint/*`에 `Authorization: Bearer <JWT>` 필수. JWT는 **HS256**, 클레임 **`sub` = user_id**(요청의 path/query/body `user_id`와 일치해야 함). 비우면 기존처럼 공개 데모 API. 웹앱은 `apps/saum-webapp/.env.development.local` 등에 `VITE_USER_JWT=<토큰>` 또는 브라우저 `localStorage.paypoint_jwt`로 동일 토큰을 넣을 수 있음(개발용).
- **오퍼레이터 콘솔**: `pnpm dev:console` 시 Vite 프록시가 루트 `.env`의 `ADMIN_API_KEY`를 자동으로 붙입니다(API와 동일 값). 브라우저에 키를 넣지 않습니다.
- **`POST /v1/paypoint/issue`**, **`POST /v1/admin/credits/issue`** — 본문에 `idempotency_key`(선택)를 주면 동일 키 재요청 시 **200** + 저장된 결과(첫 성공 시 본문과 동일). 키 없으면 기존처럼 매번 새 적립.
- **`POST /v1/paypoint/conversion/request`** — `idempotency_key` 또는 `client_request_id`(선택)로 멱등. 웹앱은 매 요청에 `client_request_id`(UUID)를 붙여 네트워크 재시도 시 중복 생성을 줄임.
- **`GET /v1/paypoint/transactions`** — 쿼리 `user_id`(필수), `limit`, `cursor`, 선택 **`type`**(`ISSUE`|`SPEND`|`EXPIRE`|`ADJUST`), 선택 **`source`**(트랜잭션 `metadata.source`와 **전체 문자열 일치**). 디앱 **적립 내역**은 `type=ISSUE`와 출처 필터를 조합해 조회한다.

### 멱등 키 운영 가이드 (필수 vs 선택)

| 엔드포인트 | 키 필드 | 필수 | 동일 키 재요청 시 |
|------------|---------|------|-------------------|
| `POST /v1/paypoint/issue` | `idempotency_key` | **선택** | **200** + 첫 성공 본문(저장됨) |
| `POST /v1/admin/credits/issue` | `idempotency_key` | **선택** | 위와 동일 |
| `POST /v1/paypoint/spend` | `idempotency_key` | **암묵적** | 키가 없으면 내부적으로 `spend:{user_id}:{order_id}` 사용. 다른 주문과 동일 `order_id`를 쓰지 않으면 결제 단위로 멱등. 명시적 `idempotency_key`로 바꿀 수 있음. |
| `POST /v1/paypoint/conversion/request` | `idempotency_key` **또는** `client_request_id` | **선택** | 키가 있으면 **200** + 동일 본문. `client_request_id`만 주면 저장 키는 `conversion:{user_id}:{client_request_id}`. |

운영 권장: 네트워크 재시도·클라이언트 중복 클릭이 있는 **쓰기**에는 가능하면 명시적 멱등 키(또는 전환의 `client_request_id`)를 붙인다. **읽기**(balance, transactions 등)는 멱등이 아니어도 되며, 위 표는 **쓰기** 기준이다.

## 랜딩 및 디앱

- **랜딩** (`/`): 마케팅/진입 전용. 상단 디앱 네비게이션 없음. **디앱 들어가기** → `/app`, **가게 관리** → `/app/store`
- **디앱** (`/app/*`): 상단 메뉴(브랜드는 랜딩으로, **디앱** 라벨 표시) + 잔액, 내역, **적립 내역**, **적립 장소**, **디지털 상품권 스토어**, 결제, 정산 옵션, 가게

### 문서([PROJECT_ANALYSIS_AND_PLAN.md](./PROJECT_ANALYSIS_AND_PLAN.md)) 대비 구현 현황

| 구분 | 내용 |
|------|------|
| **구현됨 (MVP)** | PayPoint(선택 **`USER_JWT_SECRET`**·Bearer·`sub`): Issue·Spend·Balance·Transactions·전환…, Admin(선택 **`ADMIN_API_KEY`**), **`GET /health`**, 웹앱·콘솔 UI |
| **미구현·스텁** | Admin **역할별** RBAC·2인 승인, 정책 draft/submit/activate API, 예외 큐, Conversion Router 실연동(DEX/CEX), `paypoint-worker`, Mobile 셸 |
| **데모 데이터** | 적립 장소 목록·지도 링크, 상품권 카탈로그(구매 시 Spend API는 실연동) |
| **마켓플레이스** | 카탈로그·멀티 머천트·C2C 등 **전용 마켓 UI/API 없음** (상품권 페이지는 고정 목업) |

### 제품 관점: 머지(통합)와 모음(쌓음)

- **머지포인트에 가깝게 쓰려면**: PayPoint는 **단일 단위(SSOT)의 앱 크레딧**이다. 온·오프체인 **여러 인센티브를 “한 잔액”으로 보이게 하려면**, 각 소스(체인 이벤트, 제휴 포인트, 결제 캐시백 등)가 **각각 `issue`(또는 정책 기반 내부 발행)**로 엔진에 유입되도록 **연동 레이어**를 두면 된다. 저장소 안에는 **자동 멀티체인 스캐너·타사 포인트 API 어댑터**는 없고, 그 부분은 **별도 서비스 과제**다.
- **상품권**: 디앱 **디지털 상품권** 화면에서 목업 상품을 **Spend API**로 구매하는 흐름은 연결되어 있다. 재고·정산·제휴사 검증은 미포함.
- **마켓플레이스**: 탐색·장바구니·다수 판매자 같은 **마켓플레이스 제품**은 아직 없다. 확장 시 상품 메타데이터·머천트 정산은 API/DB 확장이 필요하다.
- **모음(쌓음) 디앱**: 랜딩(`/`)과 디앱(`/app/*`)이 분리되어 있고, **잔액·전체 내역·적립 내역(출처 필터·API `source`/`type`)·적립 장소(데모)·상품권(데모)·결제·정산 옵션·가게(가맹 정산)**까지 한 앱 안에서 **“모으고 쓰고 정산”** 스토리를 보여 준다. 다만 UI에 **“온체인 월렛 A + 제휴 B”** 식의 **소스별 탭**은 없고, 통합은 **하나의 `user_id` 계정 잔액**으로만 표현된다.

- **가게** (`/app/store`): 가맹점 ID, 정산 요청, **실제 정산금 유입 과정**(REQUESTED → AUTHORIZED → SETTLED), 정산 현황·전환 목록(**정산 완료 시 tx_hash·settlement_ref 표시**)
- **관리자**: `pnpm dev:console` → http://localhost:5174 (사용자 검색, 수동 발급, 전환 승인/정산, **감사 로그**)
- **빌드**: `pnpm install && pnpm run build` (전체 검증 완료)

## Conversion (PayPoint → Stable)

- **사용자**: saum WebApp → "정산 옵션"에서 전환 요청 (MERCHANT_SETTLEMENT).
- **운영자**: Operator Console → "전환" 메뉴에서 요청 목록 조회, **승인**(잔액 예약) → **정산**(차감 확정) 또는 **실패**(예약 해제).
- 상태: `REQUESTED` → `AUTHORIZED`(예약) → `SETTLED`(확정) / `FAILED`.

## Docs

- [Project analysis & execution plan](./PROJECT_ANALYSIS_AND_PLAN.md) — **§5** 단계별 로드맵(Phase 0~4), **§7** Phase 0 구현 체크리스트(완료/남음), **§10** 남은 투두·백로그 ID(`P0-*`, `M1-*`, `B1-*`, `C1-*`, `MP-*`, `W1-*`: 머지·모음·마켓·하드닝 포함)
- [PayPoint 적립 정책 및 결제 시 적립 기술 과정](./docs/PAYPOINT_EARN_POLICY_AND_FLOW.md)
- [PayPoint dev docs](./paypoint%20dev%20docs.txt)
