# PostgreSQL 트랜잭션·락 운영 메모 (PayPoint API)

프로덕션에서 잔액·전환 일관성을 지키기 위한 **격리 수준**, **행 락**, **연결 풀** 관점의 체크리스트이다. 코드 기준 경로는 `apps/paypoint-api` 기준이다.

## 1. 애플리케이션에서 하는 일

| 경로 | 방식 | 목적 |
|------|------|------|
| `services/spend.ts` | `prisma.$transaction` + `SELECT … FROM paypoint_accounts WHERE user_id = $1 FOR UPDATE` | 동일 계정 동시 차감 직렬화, 이중 사용 방지 |
| `services/conversion.ts` | 동일 패턴으로 계정 행 `FOR UPDATE` | 예약(authorized)·정산·실패 시 `reserved_balance` / `balance` 일관성 |
| `services/issue.ts` | `prisma.$transaction` 내 `findUnique` → `update` (명시적 `FOR UPDATE` 없음) | 단일 트랜잭션 원자성; 동일 `user_id`에 대한 **고빈도 동시 적립**이 예상되면 계정 행 `FOR UPDATE` 도입 검토 |
| 읽기 전용 API | 대부분 단일 쿼리 | 멱등 읽기; 보고용 스냅샷이 필요하면 `REPEATABLE READ` 또는 읽기 레플리카 정책을 별도 정의 |

PostgreSQL 기본 격리는 **READ COMMITTED**이다. Prisma 인터랙티브 트랜잭션(`$transaction(fn)`)도 일반적으로 동일하다. **Spend / Conversion**은 `FOR UPDATE`로 같은 계정 행에 대한 갱신을 큐처럼 직렬화하므로, 잔액 불변 조건은 이 패턴에 의존한다.

## 2. 운영 체크리스트

1. **DB 기본 격리**  
   - 앱이 `READ COMMITTED`를 가정한다. 세션 단위로 `REPEATABLE READ`/`SERIALIZABLE`을 올리면 데드락·재시도 정책이 달라질 수 있으므로, 변경 시 부하 테스트로 검증한다.

2. **연결 풀**  
   - PgBouncer 등 **트랜잭션 모드** 사용 시, Prisma 트랜잭션이 **한 연결에 묶이는지** 확인한다. (prepare/중첩 트랜잭션 이슈 방지.)

3. **타임아웃**  
   - `statement_timeout` / `lock_timeout`을 운영 값으로 두어, 장시간 잠금으로 풀이 막히지 않게 한다. API 레벨 요청 타임아웃과 함께 튜닝한다.

4. **데드락**  
   - 여러 행을 잠글 때는 **항상 동일한 순서**로 잠그는 패턴을 유지한다. 현재 구현은 계정 **한 행**만 `FOR UPDATE`하므로 데드락 위험은 낮다.

5. **마이그레이션·배치**  
   - 대량 `UPDATE`/`DELETE`는 피크 시간을 피하고, 필요 시 `FOR UPDATE SKIP LOCKED` 등 배치 전용 패턴을 쓴다 (엔진 잔액 경로와 분리).

## 3. 문서 정합

- 로드맵: `PROJECT_ANALYSIS_AND_PLAN.md` §10.1 **P0-4**.
- 멱등(쓰기 재시도): README 「멱등 키 운영 가이드」.
