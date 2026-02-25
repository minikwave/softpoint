# PayPoint 적립 정책 및 결제·적립 기술 과정

## 1. 적립 정책 (Policy)

### 1.1 적립이 발생하는 경우

PayPoint는 다음 경로로 **적립(Issue)** 된다.

| 구분 | 설명 | 발행 주체 |
|------|------|-----------|
| **결제 시 적립** | 가맹점에서 결제한 금액의 일정 비율/고정액을 PayPoint로 지급 | PayPoint Engine (결제 연동 시) |
| **프로모션** | 이벤트·캠페인으로 지급 (예: 가입 축하, 리뷰 적립) | 운영자(Operator Console) |
| **선불 구매** | 사용자가 현금으로 PayPoint를 구매 | 결제·정산 연동 후 Engine |
| **상품권/바우처** | 디지털 상품권 구매 시 또는 상품권 사용 시 정책에 따른 적립 | Engine + 정책 |

### 1.2 결제 시 적립 정책 예시 (가맹점 결제 연동)

실제 결제가 발생했을 때 **얼마나** PayPoint를 적립할지는 **정책(Policy)**으로 정의한다.

**예시 1: 결제 금액의 N% 적립**

- 정책: 결제 금액의 **1%**를 PayPoint로 적립 (소수점 이하 절사).
- 예: 10,000원 결제 → 100 PP 적립.

**예시 2: 구간별 적립**

- 1만 원 미만: 0 PP  
- 1만 원 이상 ~ 5만 원 미만: 100 PP  
- 5만 원 이상: 200 PP  

**예시 3: 고정액 + 비율**

- 건당 50 PP 고정 + 결제 금액의 0.5%.

**정책 파라미터 예시 (Policy JSON)**

```json
{
  "policy_id": "PAYMENT_EARN_POLICY",
  "version": "1.0",
  "effective_from": "2026-03-01T00:00:00Z",
  "rules": {
    "type": "percent",
    "percent_bps": 100,
    "min_payment_amount": "1000",
    "max_earn_per_tx": "1000",
    "round_down": true
  }
}
```

- `percent_bps`: 100 = 1% (100/10000).
- `min_payment_amount`: 이 금액 이상 결제 시에만 적립.
- `max_earn_per_tx`: 1회 결제당 최대 적립 PP.
- `round_down`: true면 소수점 이하 절사.

### 1.3 적립 한도·제한 (선택)

- **일별 적립 한도**: 사용자당 하루 최대 N PP.
- **가맹점/카테고리 제한**: 특정 가맹점 또는 상품군에서만 적립.
- **만료**: 적립 시점부터 N일 후 만료 (정책의 `expires_at` 또는 기본 규칙).

---

## 2. 결제 시 적립 기술 과정 (Technical Flow)

### 2.1 전체 흐름

```
[가맹점/결제 단말]  결제 완료
        ↓
[결제 연동 서비스]  결제 금액, order_id, user_id, merchant_id 수신
        ↓
[PayPoint Engine]   정책 조회 → 적립량 계산 → Issue API 호출
        ↓
[Engine]            POST /v1/paypoint/issue (또는 내부 issueCredit)
        ↓
[DB]                paypoint_accounts.balance += amount
                    paypoint_transactions (type=ISSUE) 추가
        ↓
[선택] Settlement    Receipt 생성 (정산 레이어 전달)
```

### 2.2 단계별 기술 사양

#### Step 1: 결제 완료 이벤트 수신

- **입력**: 결제 금액(`payment_amount`), 주문 ID(`order_id`), 사용자 ID(`user_id`), 가맹점 ID(`merchant_id`), 통화 등.
- **담당**: 결제 연동 서비스(Payment Gateway 연동 또는 POS 연동).

#### Step 2: 적립 정책 조회

- **API/저장소**: `paypoint_policies` 테이블 또는 Policy API.
- **조회**: 현재 유효한 `PAYMENT_EARN_POLICY` (또는 가맹점별 정책)의 `rules` 조회.
- **출력**: 비율(bps), 최소 결제액, 최대 적립/건, round_down 등.

#### Step 3: 적립량 계산

**의사 코드**

```
function calculateEarnAmount(paymentAmount: bigint, policy: PolicyRules): bigint {
  if (paymentAmount < policy.min_payment_amount) return 0n;
  let earn = (paymentAmount * policy.percent_bps) / 10000n;
  if (policy.round_down) earn = earn;  // 정수 나눗셈으로 이미 절사
  if (policy.max_earn_per_tx && earn > policy.max_earn_per_tx)
    earn = policy.max_earn_per_tx;
  return earn;
}
```

- **입력**: 결제 금액, 정책 규칙.
- **출력**: 적립할 PayPoint 양(정수).

#### Step 4: Issue 호출 (엔진)

- **엔드포인트**: `POST /v1/paypoint/issue` (외부 연동) 또는 내부 `issueCredit()`.
- **Body 예시**

```json
{
  "user_id": "U123",
  "amount": "100",
  "reason": "PAYMENT_EARN",
  "expires_at": "2026-12-31T23:59:59Z"
}
```

- **메타데이터 권장**: `metadata` 또는 `reason`에 `order_id`, `merchant_id`, `payment_amount` 등 저장 (감사·이력 조회용).

#### Step 5: 엔진 내부 처리 (이미 구현된 로직)

1. **계정 조회/생성**: `user_id`로 `paypoint_accounts` 조회, 없으면 생성.
2. **트랜잭션**: `balance += amount`, `paypoint_transactions`에 type=ISSUE, amount, metadata 삽입.
3. **선택**: 정산 레이어에 Receipt 전달 (결제 금액, paypoint_component 등).

#### Step 6: (선택) 정산·영수증

- 결제 금액 전체에 대한 Receipt에 `paypoint_component`(이번 건 적립량)를 기록.
- 가맹점 정산 시 PayPoint 사용분·적립분을 구분해 정산 레이어와 연동.

### 2.3 시퀀스 다이어그램 (요약)

```
User    POS/GW    결제연동    Policy    PayPoint Engine    DB
 |         |          |          |            |           |
 |--결제--->|          |          |            |           |
 |         |--이벤트-->|          |            |           |
 |         |          |--정책조회->|            |           |
 |         |          |<--rules---|            |           |
 |         |          |--적립량계산           |           |
 |         |          |----POST /issue------->|           |
 |         |          |          |            |--트랜잭션->|
 |         |          |          |            |<--OK-------|
 |         |          |<--201 Created---------|           |
 |         |<--적립완료|          |            |           |
 |<--영수증(적립표시)|          |            |           |
```

### 2.4 idempotency

- 동일 결제(`order_id`)로 중복 적립 방지: **idempotency key** = `issue:PAYMENT_EARN:{order_id}`.
- 연동 서비스에서 Issue 호출 시 위 키를 넣고, 엔진에서 재전송 시 기존 결과 반환.

### 2.5 에러·재시도

- **INVALID_AMOUNT**: 적립량 0이면 Issue 호출 생략.
- **ACCOUNT_NOT_FOUND**: 계정 자동 생성(현재 구현됨).
- **일시적 오류**: 연동 서비스에서 재시도(동일 idempotency key).

---

## 3. 문서 버전 및 연관 문서

- **버전**: 1.0  
- **연관**: `paypoint dev docs.txt`, `PROJECT_ANALYSIS_AND_PLAN.md`, `paypoint_policies` 스키마 및 Policy API 설계.

이 문서는 “결제 시 얼마나, 어떤 조건으로 적립하는가(정책)”와 “결제 이벤트부터 Issue까지의 기술적 과정”을 구현·운영 시 참고할 수 있도록 정리한 것이다.
