# 빌드 및 연동 확인

## 1. 랜딩 → 디앱

- **랜딩** (`/`): 헤더(제품·개발자·디앱), MVP pill, "쌓음" 타이틀, **디앱 들어가기** → `/app`. **제품** `/product`, **개발자** `/developers` 에서 현황·닥스 링크 확인
- **가게 관리** 버튼 → `/app/store`
- 디앱 내 네비: 잔액, 내역, 결제, 정산 옵션, 가게

## 2. 포인트 제도 관리자 페이지 (Operator Console)

- **주소**: `pnpm dev:console` → http://localhost:5174
- **기능**:
  - 사용자 검색 (`/v1/admin/users`)
  - 계정 상세 + 수동 발급 (`/v1/admin/accounts/:userId`, `/v1/admin/credits/issue`)
  - 전환 승인/정산/실패 (`/v1/admin/conversions`, approve, settle, fail)
- **엔진 연동**: 모든 Admin API → paypoint-api (`/v1/admin/*`)

## 3. 소비자 UX/UI (saum WebApp)

- **주소**: `pnpm dev:webapp` → http://localhost:5173 (프록시 `/v1` → API)
- **기능**:
  - 잔액: `GET /v1/paypoint/balance/:user_id`
  - 내역: `GET /v1/paypoint/transactions?user_id=`
  - 결제: `POST /v1/paypoint/spend`
  - 정산 옵션: `POST /v1/paypoint/conversion/request`, `GET /v1/paypoint/conversion/:id`
- **엔진 연동**: 위 PayPoint API 전부 사용

## 4. 가게(리테일) UX/UI

- **경로**: 랜딩에서 "가게 관리" 또는 디앱 내 **가게** 메뉴 → `/app/store`
- **기능**:
  - 가맹점 ID 입력, 정산 요청 (PayPoint → Stable, type=MERCHANT_SETTLEMENT)
  - 내 전환 요청 목록: `GET /v1/paypoint/conversions?user_id=`
- **엔진 연동**: `POST /v1/paypoint/conversion/request`, `GET /v1/paypoint/conversions`

## 5. 포인트 엔진 연동 요약

| 클라이언트       | 사용 API |
|-----------------|----------|
| saum-webapp     | /v1/paypoint/balance, /transactions, /spend, /conversion/request, /conversion/:id, /conversions |
| operator-console| /v1/admin/users, /accounts/:userId, /credits/issue, /conversions, /conversions/:id/approve, settle, fail |

엔진(paypoint-api)은 SSOT로 잔액·거래·전환·감사 로그를 관리하며, 위 클라이언트는 모두 API만 호출하고 DB 직접 접근 없음.

## 6. 빌드 테스트

로컬에서 다음 순서로 실행:

```bash
# 의존성 설치
pnpm install

# 전체 빌드 (domain → api(prisma generate + tsc) → webapp → console)
pnpm run build
```

**빌드 결과** (검증 완료):
- **paypoint-domain**: `tsc` → `packages/paypoint-domain/dist`
- **paypoint-api**: `prisma generate && tsc` → `apps/paypoint-api/dist`
- **saum-webapp**: `vite build` → `apps/saum-webapp/dist`
- **operator-console**: `vite build` → `apps/operator-console/dist`
