# SoftPoint — Programmable Credit

독립 프로덕트 **SoftPoint**: 원장·영수증·정책·감사로 크레딧 흐름을 추적하는 엔진 + 소비자 디앱 + 운영 콘솔.

- **레포**: https://github.com/minikwave/softpoint
- **마케팅**: `/` · **디앱**: `/app/*` (UI·라우트 분리)

## Structure

```
apps/
  softpoint-api/      # REST API (Engine + Admin)
  softpoint-web/      # Marketing site + Consumer D-App
  operator-console/   # Operator Console
packages/
  softpoint-domain/   # Types, invariants, paymentEarn
```

## Setup

```bash
pnpm install
cp .env.example .env
pnpm db:push
pnpm db:seed
pnpm dev:api          # http://localhost:3000
pnpm dev:web          # http://localhost:5173
pnpm dev:console      # http://localhost:5174
```

## Deploy

[docs/DEPLOY.md](./docs/DEPLOY.md)

## Docs

- [PRODUCT_NAMING.md](./docs/PRODUCT_NAMING.md)
- [ROADMAP_FROM_DEV_DOCS_2.md](./docs/ROADMAP_FROM_DEV_DOCS_2.md)
