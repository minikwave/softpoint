# Soft stack boundary — SoftPoint · SoftPay · SoftPG

> SoftPoint 레포 SSOT. SoftPay / SoftPG 레포의 경계 문서와 정렬한다.  
> SoftPay: `softpay/docs/PRODUCT_BOUNDARIES.md` · SoftPG: `softpg/docs/PRODUCT_SCOPE_AND_ROADMAP.md`

## 한 줄

| 제품 | 역할 | SoftPoint와의 관계 |
|------|------|-------------------|
| **SoftPoint** | 소비자·가맹 **보상 SP 엔진** (적립·사용·바우처·마켓) | 이 레포 |
| **SoftPay** | SoftBlock **Pilot** 상거래 결제 (Intent→Receipt · PSP rail) | SoftPay SETTLED → SoftPoint earn · SoftPay checkout에서 SP mix |
| **SoftPG** | SoftAgent **agent credit** (`pi_` / `rcpt_`) | **연동 금지** — SoftPoint ≠ SoftPG credit |

## SoftPoint는

- SoftPay 결제 완료(`settlement.completed`) 후 **로열티 SP 적립**
- SoftPay checkout에서 **SP 부분 사용**(loyalty mix) — rail id 예: `softpoint_sp`
- 바우처·활동 적립·전환 등 **포인트 UX**

## SoftPoint는 하지 않음

- SoftAgent paid-tool의 **agent credit** 경로를 SoftPG 대신 수행
- SoftPG `PaymentIntent` (`pi_`) / signed `Receipt` (`rcpt_`) 계약을 SoftPoint API에 복제
- SoftPay connector-kit을 “SoftPG”라고 부르거나 SoftPG `internal_credit`과 동일 제품으로 포지셔닝

## SoftPay 연동 (권장)

```
Buyer checkout (SoftPay)
  → Intent SETTLED
  → SoftPay webhook settlement.completed
  → SoftPoint POST /hooks/softpay  (HMAC)
  → earnFromPayment (order_id = softpay intent id)
  → User SP balance ↑
```

환경 변수 (SoftPoint API):

| Env | 설명 |
|-----|------|
| `SOFTPAY_WEBHOOK_SECRET` | SoftPay `WEBHOOK_SECRET`과 동일 (HMAC) |
| `SOFTPAY_EARN_ENABLED` | `1`이면 SoftPay 웹훅 적립 활성 (기본 on if secret set) |

SoftPay 쪽 (선택):

| Env | 설명 |
|-----|------|
| `SOFTPOINT_EARN_URL` | SoftPoint `https://…/hooks/softpay` |
| `SOFTPOINT_API_URL` | SoftPoint Engine base (loyalty module) |

## SoftPG 비충돌 체크리스트

- [ ] SoftPoint 문서·API에 SoftPG `pi_` / `rcpt_` / `paid_actions` 계약 재사용 금지
- [ ] SoftPoint “CreditProduct”는 **SP 바우처 카탈로그** — SoftPG agent credit 아님
- [ ] SoftAgent는 SoftPG만 호출; SoftPoint를 SoftAgent credit 우회로 쓰지 않음
- [ ] SoftPay loyalty-points 모듈은 SoftPoint HTTP만 호출

## 용어

| 쓰면 됨 | 쓰지 말 것 |
|---------|------------|
| SoftPoint SP · rewards · loyalty | SoftPG credit · agent credit · SoftCredit(제품명) |
| SoftPay Intent / SETTLED | SoftPG PaymentIntent를 SoftPoint 주문 ID처럼 혼용 |

관련: [PRODUCT_NAMING.md](./PRODUCT_NAMING.md) · [INTEGRATION_ONBOARDING.md](./INTEGRATION_ONBOARDING.md)
