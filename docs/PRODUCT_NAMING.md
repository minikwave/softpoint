# SoftPoint 제품·네이밍

| 구분 | 표기 | 용도 |
|------|------|------|
| **제품명** | **SoftPoint** | 마케팅·랜딩·디앱·문서 |
| **슬러그** | **softpoint** | 레포 `minikwave/softpoint`, 패키지 `softpoint-*` |
| **엔진 API 경로** | `/v1/paypoint/*` | 하위 호환·안정적 통합 surface (내부 테이블명도 `paypoint_*` 유지) |
| **크레딧 단위** | PP (PayPoint 단위) | 잔액·상품 가격 표기 |

## 레거시 (신규 작업 대상 아님)

- `ziptalk/pay-saum`, `minikwave/paypoint`
- 브랜드 **쌓음(saum)** — SoftPoint 이전 세대

## 코드 위치

- 마케팅: `apps/softpoint-web/src/pages/Landing.tsx`, `layouts/MarketingLayout.tsx`
- 디앱: `apps/softpoint-web/src/layouts/DAppLayout.tsx`, `/app/*`
- API: `apps/softpoint-api`
