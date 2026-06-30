import { useState, useEffect } from 'react';
import { api } from '../api/client';

const DEFAULT_USER = 'U1';

function formatAmount(s: string): string {
  const n = Number(s);
  if (Number.isNaN(n)) return s;
  return n.toLocaleString('ko-KR');
}

export default function Balance() {
  const [userId, setUserId] = useState(DEFAULT_USER);
  const [balance, setBalance] = useState<{
    user_id: string;
    balance: string;
    reserved_balance: string;
    available: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBalance = async () => {
    setLoading(true);
    setError(null);
    const { data, error: e } = await api.getBalance(userId);
    setLoading(false);
    if (e) {
      setError(e.message);
      setBalance(null);
      return;
    }
    if (data) setBalance(data);
  };

  useEffect(() => {
    fetchBalance();
  }, [userId]);

  return (
    <>
      <h1 className="page-title">잔액</h1>

      <div className="card">
        <label className="card-title">사용자 ID</label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          onBlur={() => userId && fetchBalance()}
          placeholder="예: U1"
          style={{ marginBottom: 0, padding: '0.65rem 0.85rem', width: '100%', maxWidth: '200px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)' }}
        />
      </div>

      {loading && <p className="loading">조회 중…</p>}
      {error && <div className="msg-error">{error}</div>}

      {!loading && balance && (
        <div className="card">
          <p className="card-title">보유 PayPoint</p>
          <p className="balance-value">{formatAmount(balance.available)} PP</p>
          <p className="card-title" style={{ marginTop: '1rem' }}>예약 잔액</p>
          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {formatAmount(balance.reserved_balance)} PP
          </p>
          <p className="card-title" style={{ marginTop: '0.5rem' }}>총 잔액</p>
          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {formatAmount(balance.balance)} PP
          </p>
        </div>
      )}

      {!loading && !balance && !error && (
        <div className="card">
          <p className="empty">계정이 없습니다. API에서 해당 사용자로 먼저 적립(issue)해 주세요.</p>
        </div>
      )}
    </>
  );
}
