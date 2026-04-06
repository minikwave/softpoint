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

function txSourceLabel(meta: unknown): string {
  if (meta && typeof meta === 'object' && 'source' in meta) {
    const s = (meta as { source: unknown }).source;
    if (typeof s === 'string' && s.trim()) return s;
  }
  return '—';
}

function typeBadge(type: string): string {
  const t = type.toLowerCase();
  if (t === 'issue') return 'badge-issue';
  if (t === 'spend') return 'badge-spend';
  if (t === 'expire') return 'badge-expire';
  if (t === 'adjust') return 'badge-adjust';
  return '';
}

export default function Transactions() {
  const [userId, setUserId] = useState(DEFAULT_USER);
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.getTransactions(userId)
      .then(({ data, error: e }) => {
        if (cancelled) return;
        setLoading(false);
        if (e) {
          setError(e.message);
          setItems([]);
          return;
        }
        if (data) setItems(data.items);
      });
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <>
      <h1 className="page-title">내역</h1>

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
            <p className="empty">거래 내역이 없습니다.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>유형</th>
                    <th>금액</th>
                    <th>출처</th>
                    <th>주문 ID</th>
                    <th>일시</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <tr key={t.tx_id}>
                      <td>
                        <span className={`badge ${typeBadge(t.type)}`}>{t.type}</span>
                      </td>
                      <td>{formatAmount(t.amount)} PP</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{txSourceLabel(t.metadata)}</td>
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
