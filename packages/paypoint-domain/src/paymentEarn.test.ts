import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePaymentEarnAmount, parsePercentRulesFromPolicyJson } from './paymentEarn.js';

describe('parsePercentRulesFromPolicyJson', () => {
  it('parses flat policy_json', () => {
    const rules = parsePercentRulesFromPolicyJson({
      percent_bps: 100,
      min_payment_amount: '1000',
      max_earn_per_tx: '500',
    });
    assert.ok(rules);
    assert.equal(rules.percentBps, 100n);
    assert.equal(rules.minPaymentAmount, 1000n);
    assert.equal(rules.maxEarnPerTx, 500n);
  });

  it('parses nested rules object', () => {
    const rules = parsePercentRulesFromPolicyJson({
      rules: { percent_bps: 50, min_payment_amount: '1' },
    });
    assert.ok(rules);
    assert.equal(rules.percentBps, 50n);
  });
});

describe('calculatePaymentEarnAmount', () => {
  const policy = { percent_bps: 100, min_payment_amount: '1000', max_earn_per_tx: '200' };

  it('returns 0 below min payment', () => {
    assert.equal(calculatePaymentEarnAmount(500n, policy), 0n);
  });

  it('calculates 1% with cap', () => {
    assert.equal(calculatePaymentEarnAmount(10_000n, policy), 100n);
    assert.equal(calculatePaymentEarnAmount(50_000n, policy), 200n);
  });

  it('returns 0 for invalid policy', () => {
    assert.equal(calculatePaymentEarnAmount(10_000n, {}), 0n);
  });
});
