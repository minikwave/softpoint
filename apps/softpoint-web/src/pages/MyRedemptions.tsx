import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type RedemptionItem } from '../api/client';

const DEFAULT_USER = 'U1';

export default function MyRedemptions() {
  const [userId, setUserId] = useState(DEFAULT_USER);
  const [items, setItems] = useState<RedemptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getRedemptions(userId).then(({ data, error: e }) => {
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
      <h1 className="page-title">내 교환 상품</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        교환한 기프티콘·크레딧 코드를 확인합니다.
      </p>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <label className="card-title">사용자 ID</label>
        <input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} />
      </div>

      {loading && <p className="loading">불러오는 중…</p>}
      {error && <div className="msg-error">{error}</div>}

      {!loading && !error && items.length === 0 && <p className="empty">교환 내역이 없습니다.</p>}

      {!loading && items.length > 0 && (
        <div className="card">
          <ul className="place-list">
            {items.map((r) => (
              <li key={r.id} className="place-item">
                <div className="place-name">{r.product_name}</div>
                <div className="place-meta">
                  {r.status} · {new Date(r.created_at).toLocaleString('ko-KR')}
                </div>
                {r.code_display && (
                  <div className="mono-small" style={{ marginTop: '0.35rem' }}>
                    코드: <strong>{r.code_display}</strong>
                  </div>
                )}
                {r.receipt_id && (
                  <Link to={`/app/receipts/${r.receipt_id}`} className="place-map-link">
                    영수증 보기
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
