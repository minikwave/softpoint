# 배포: SoftPoint — Supabase · Railway · Vercel

**SoftPoint** 웹은 Vercel, **Engine API**는 Railway(Docker), DB는 Supabase Postgres입니다.

## 인프라 (신규 · 2026-06)

| 구분 | 내용 |
|------|------|
| **Git** | https://github.com/minikwave/softpoint (`softpoint` remote만 사용) |
| **Supabase** | 프로젝트 `softpoint`, ref `cjqykyeqhoqlxnuzuatu`, region `ap-northeast-1` |
| **Railway** | 프로젝트 `softpoint` — https://railway.com/project/3744fafd-8a01-40f6-a7fc-25aa43fb6390 · API `https://softpoint-production.up.railway.app` |
| **Vercel** | 프로젝트 `softpoint-web` — `apps/softpoint-web` |

레거시 `pay-saum` / `paypoint` / `saum-paypoint` 연동은 사용하지 않습니다.

## Railway `DATABASE_URL`

1. [Supabase Database settings](https://supabase.com/dashboard/project/cjqykyeqhoqlxnuzuatu/settings/database)에서 비밀번호 확인
2. PowerShell:

```powershell
$env:SUPABASE_DB_PASSWORD = 'YOUR_PASSWORD'
$env:SUPABASE_PROJECT_REF = 'cjqykyeqhoqlxnuzuatu'
.\scripts\set-railway-database-url.ps1 -Service softpoint-api
npx @railway/cli up -s softpoint-api -d
```

## DB 스키마·시드

- 스키마: Supabase MCP `softpoint_init_schema` 또는 `cd apps/softpoint-api && npx prisma db push`
- 시드: `pnpm db:seed` (동일 `DATABASE_URL` 필요)

## Vercel (웹)

레포 **루트**에서 배포합니다 (`vercel.json`이 모노레포 빌드를 처리).

```bash
cd /path/to/softpoint
npx vercel deploy --prod --yes \
  --build-env VITE_API_URL=https://softpoint-production.up.railway.app \
  --build-env VITE_REPO_URL=https://github.com/minikwave/softpoint
```

Vercel 프로젝트 Root Directory는 **`.`**(레포 루트)로 두세요. `apps/softpoint-web`만 루트로 두면 `@softpoint/sdk` 워크스페이스를 찾지 못합니다.

## 검증

- `GET https://<api>/health` → `softpoint-api`
- `GET https://<api>/v1/paypoint/balance/U1` → `100000` (시드 후)
- `https://<vercel>/` → 마케팅 랜딩 · `/app` → 디앱 (분리 UI)
