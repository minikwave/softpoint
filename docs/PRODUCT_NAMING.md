# SoftPoint 제품·네이밍

| 구분 | 표기 | 용도 |
|------|------|------|
| **제품명** | **SoftPoint** | 마케팅·랜딩·디앱·문서 (한·영 동일) |
| **슬러그** | **softpoint** | 레포 `minikwave/softpoint` |
| **포인트 단위** | **SP** | UI·API 응답 표기 |
| **API 경로** | `/v1/paypoint/*` | 안정적 통합 surface (내부 테이블명 유지) |

**saum**, **쌓음**, **PayPoint**(브랜드) 는 신규 UI·문서에서 사용하지 않습니다.
**SoftCredit** 은 제품명으로 쓰지 않습니다 (카탈로그 `CreditProduct` = SP 바우처).

## SoftPay · SoftPG

| 제품 | SoftPoint 관계 |
|------|----------------|
| SoftPay | SETTLED → SP 적립 · checkout SP mix (`softpoint_sp`) |
| SoftPG | **비연동** — SoftAgent agent credit 전용 |

상세: [SOFT_STACK_BOUNDARY.md](./SOFT_STACK_BOUNDARY.md)

자세한 비전: [SOFTPOINT_PRODUCT_VISION.md](./SOFTPOINT_PRODUCT_VISION.md)
