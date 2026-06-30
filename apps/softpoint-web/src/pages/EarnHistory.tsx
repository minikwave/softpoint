import { useState, useEffect } from 'react';
import { api, type TransactionItem } from '../api/client';

const DEFAULT_USER = 'U1';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return iso;
  }
}

function formatAmount(s: string): string {
  const n = Number(s);
  if (Number.isNaN(n)) return s;
  return n.toLocaleString('ko-KR');
}

export default function EarnHistory() {
  const [userId, setUserId] = useState(DEFAULT_USER);
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.getTransactions(userId, 50, undefined, 'ISSUE')
      .then(({ data, error: e }) => {
        if (cancelled) return;
        setLoading(false);
        if (e) {
          setError(e.message);
          setItems([]);
          return;
        }
        setItems(data?.items ?? []);
      });
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <>
      <h1 className="page-title">적립 내역</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        결제·프로모션·이벤트로 적립된 PayPoint 내역입니다.
      </p>

      <div className="card">
        <label className="card-title">사용자 ID</label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="예: U1"
          style={{ marginBottom: 0, padding: '0.65rem 0.85rem', width: '100%', maxWidth: '200px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)' }}
        />
      </div>

      {loading && <p className="loading">조회 중…</p>}
      {error && <div className="msg-error">{error}</div>}

      {!loading && !error && (
        <div className="card">
          {items.length === 0 ? (
            <p className="empty">적립 내역이 없습니다. 가맹점 결제 또는 프로모션 참여 시 적립됩니다.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>적립 금액</th>
                    <th>관련 주문</th>
                    <th>적립 일시</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <tr key={t.tx_id}>
                      <td className="earn-amount">+{formatAmount(t.amount)} PP</td>
                      <td>{t.order_id ?? '—'}</td>
                      <td>{formatDate(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
