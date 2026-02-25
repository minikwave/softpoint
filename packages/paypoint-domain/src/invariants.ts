/**
 * PayPoint account invariants — must always hold.
 * Double-spend prevention depends on these.
 */

export interface BalanceState {
  balance: bigint;
  reserved_balance: bigint;
}

/**
 * Invariants (document 14.1):
 * - balance >= 0
 * - reserved_balance >= 0
 * - balance - reserved_balance >= 0 (available balance)
 */
export function assertAccountInvariants(state: BalanceState): void {
  if (state.balance < 0n) {
    throw new Error('INVALID_BALANCE: balance must be >= 0');
  }
  if (state.reserved_balance < 0n) {
    throw new Error('INVALID_BALANCE: reserved_balance must be >= 0');
  }
  const available = state.balance - state.reserved_balance;
  if (available < 0n) {
    throw new Error('INVALID_BALANCE: available (balance - reserved) must be >= 0');
  }
}

export function getAvailableBalance(state: BalanceState): bigint {
  assertAccountInvariants(state);
  return state.balance - state.reserved_balance;
}

export function canSpend(state: BalanceState, amount: bigint): boolean {
  if (amount <= 0n) return false;
  return getAvailableBalance(state) >= amount;
}
