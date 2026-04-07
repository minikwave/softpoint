/**
 * 결제(Spend) 금액 기준 퍼센트 적립 — policy_json에서 rules 추출 후 계산.
 * JSON은 콘솔 초안 형태(평탄) 또는 문서 예시(`rules` 중첩) 모두 허용.
 */

function toBigIntLoose(v: unknown): bigint | null {
  if (typeof v === 'bigint') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return BigInt(Math.trunc(v));
  if (typeof v === 'string' && v.trim() !== '') {
    try {
      return BigInt(v.trim());
    } catch {
      return null;
    }
  }
  return null;
}

export interface ParsedPercentRules {
  percentBps: bigint;
  minPaymentAmount: bigint;
  maxEarnPerTx: bigint | null;
}

/**
 * policy_json에서 percent 규칙만 파싱. 없거나 타입이 맞지 않으면 null.
 */
export function parsePercentRulesFromPolicyJson(policyJson: unknown): ParsedPercentRules | null {
  if (policyJson === null || typeof policyJson !== 'object') return null;
  const root = policyJson as Record<string, unknown>;
  const rawRules =
    root.rules !== undefined && typeof root.rules === 'object' && root.rules !== null
      ? (root.rules as Record<string, unknown>)
      : root;

  const bps = toBigIntLoose(rawRules.percent_bps);
  if (bps === null || bps < 0n) return null;

  const minPay = toBigIntLoose(rawRules.min_payment_amount) ?? 0n;
  if (minPay < 0n) return null;

  let maxEarn: bigint | null = null;
  if (rawRules.max_earn_per_tx !== undefined && rawRules.max_earn_per_tx !== null) {
    const m = toBigIntLoose(rawRules.max_earn_per_tx);
    if (m !== null && m >= 0n) maxEarn = m;
  }

  return { percentBps: bps, minPaymentAmount: minPay, maxEarnPerTx: maxEarn };
}

/**
 * Spend(결제) 금액에 대한 적립 PP (정수). 정책이 없거나 규칙 불가면 0n.
 */
export function calculatePaymentEarnAmount(spendAmount: bigint, policyJson: unknown): bigint {
  if (spendAmount <= 0n) return 0n;
  const rules = parsePercentRulesFromPolicyJson(policyJson);
  if (!rules) return 0n;
  if (spendAmount < rules.minPaymentAmount) return 0n;
  let earn = (spendAmount * rules.percentBps) / 10000n;
  if (rules.maxEarnPerTx !== null && earn > rules.maxEarnPerTx) {
    earn = rules.maxEarnPerTx;
  }
  return earn;
}

export const PAYMENT_EARN_POLICY_ID = 'PAYMENT_EARN_POLICY';
