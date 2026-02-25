# 터미널 + Cursor 브라우저에서 빌드 및 테스트

## 1. 한 번만 설정

```bash
pnpm install
```

(API를 쓰려면) `.env` 파일 생성 후 `DATABASE_URL` 설정:

```bash
cp .env.example .env
# .env 에서 DATABASE_URL 수정 (PostgreSQL 연결 문자열)
pnpm db:push
```

## 2. 전체 빌드 (이쪽 터미널)

```bash
pnpm run build
```

- domain → api(prisma generate + tsc) → saum-webapp → operator-console 순으로 빌드됩니다.

## 3. 빌드 후 브라우저에서 테스트

### 방법 A: 빌드 후 API + 웹앱 동시 실행 (권장)

한 터미널에서:

```bash
pnpm run serve
```

- **API**: http://localhost:3000  
- **웹앱**: http://localhost:5173 (프록시로 `/v1` → API 연결)

**Cursor 브라우저에서**:

1. `Ctrl+Shift+P` (또는 `Cmd+Shift+P`) → **“Simple Browser: Show”** 실행  
2. URL에 **http://localhost:5173** 입력 후 열기  
3. 랜딩 → **디앱 들어가기** → 잔액/내역/결제/정산 옵션/가게 화면 확인

### 방법 B: 한 번에 빌드 + 실행

```bash
pnpm run build:and:serve
```

- 먼저 전체 빌드 후, 위와 동일하게 API + 웹앱이 실행됩니다.  
- Cursor 브라우저에서 **http://localhost:5173** 로 접속해 테스트하세요.

### 방법 C: 운영자 콘솔까지 테스트

- 터미널 1: `pnpm run serve` (API + 웹앱)  
- 터미널 2: `pnpm run dev:console`  

- **소비자/가게**: http://localhost:5173  
- **관리자 콘솔**: http://localhost:5174 (Simple Browser에 이 주소 입력)

## 4. URL 정리

| 앱           | URL                  |
|-------------|----------------------|
| 쌓음 웹앱   | http://localhost:5173 |
| PayPoint API| http://localhost:3000 |
| 운영자 콘솔| http://localhost:5174 |

Cursor **Simple Browser**에서 위 URL을 열면 터미널에서 빌드·실행한 앱을 그대로 테스트할 수 있습니다.
