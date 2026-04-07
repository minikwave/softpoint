# 배포: Supabase · Railway · Vercel

**쌓음** 웹은 Vercel, **PayPoint API** 는 Railway(Docker), DB는 Supabase Postgres를 쓰는 구성 예시입니다.

## 현재 연결 상태 (CLI로 수행한 작업)

| 구분 | 내용 |
|------|------|
| **Supabase** | `npx supabase link --project-ref jfsffnlgeqyxzlokctxl` (프로젝트명 paypoint). 마이그레이션·스튜디오는 `npx supabase db …` 로 원격 대상. |
| **Railway** | 프로젝트 `pay-saum-api`, 서비스 `paypoint-api`. 루트 `Dockerfile` + `railway.toml`. 공개 URL 예: `https://paypoint-api-production.up.railway.app` |
| **Vercel** | 프로젝트 `saum-paypoint`. 프로덕션 별칭: **https://saum-paypoint.vercel.app** (`VITE_API_URL` = 위 Railway API origin) |

로컬 디렉터리 연결은 Railway/Vercel이 각각 `.railway` / `apps/saum-webapp/.vercel` 에 저장합니다(`.vercel` 은 gitignore).

## 사전 준비

1. **Supabase**에서 **Settings → Database** 의 URI(풀러 또는 직접 연결)를 복사합니다. Prisma 사용 시 `?pgbouncer=true` 등 [공식 가이드](https://supabase.com/docs/guides/database/connecting-to-postgres)에 맞게 조정합니다.
2. **Railway** 서비스 `paypoint-api` 변수에 `DATABASE_URL` 을 위 값으로 설정합니다. (CLI: `railway variable set DATABASE_URL --stdin -s paypoint-api`)

## DB 스키마 반영 (최초 1회·스키마 변경 시)

Railway에 올린 API는 **빌드 시 `prisma migrate`를 자동 실행하지 않습니다.** 아래 중 하나로 `paypoint_*` 테이블을 만듭니다.

- **로컬에서** Railway와 **동일한** `DATABASE_URL` 로:
  ```bash
  cd apps/paypoint-api
  export DATABASE_URL="postgresql://..."   # Supabase URI
  npx prisma db push
  ```
- 또는 Supabase SQL Editor에서 스키마 적용(비권장·드리프트 주의).

`apps/paypoint-api/.env` 에 로컬용 `localhost` 가 있으면 Prisma가 그 값을 우선할 수 있으므로, 원격 반영 시에는 위처럼 환경 변수를 명시하거나 해당 파일을 잠시 치웁니다.

## Railway (API)

- 루트에서: `npx @railway/cli up -s paypoint-api -d`
- 재배포 전 `Dockerfile` 수정 후 동일 명령.
- 선택 변수: `ADMIN_API_KEY`, `USER_JWT_SECRET`, `ENABLE_PROMETHEUS_METRICS=true`

## Vercel (웹앱)

- 디렉터리: `apps/saum-webapp`
- 프로덕션 배포 예:
  ```bash
  npx vercel deploy --prod --yes \
    --build-env VITE_API_URL=https://paypoint-api-production.up.railway.app \
    --build-env VITE_REPO_URL=https://github.com/ziptalk/pay-saum
  ```
- `vercel.json` 은 **Vercel 빌드 메모리 절약**을 위해 `npm install` / `npm run build` 만 사용합니다(웹앱은 워크스페이스 패키지 미사용).

## CORS

API는 `@fastify/cors` 로 `origin: true` 이므로 Vercel 도메인에서 브라우저 호출이 가능합니다.

## 문제 해결

- **Railway 빌드 실패 (@paypoint/domain)**: `Dockerfile` 에 `pnpm --filter @paypoint/domain run build` 가 포함돼 있는지 확인합니다.
- **Vercel OOM**: 루트 전체 `pnpm install` 을 쓰지 말고, 현재처럼 웹앱 폴더만 `npm install` 합니다.
- **Vercel에서 API 404**: `VITE_API_URL` 이 Railway **https origin만**(경로 없이)인지 확인합니다. 클라이언트는 `/v1/paypoint/...` 를 붙입니다.
