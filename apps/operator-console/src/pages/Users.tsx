import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, type AdminUserItem } from '../api/client';

function formatAmount(s: string): string {
  const n = Number(s);
  if (Number.isNaN(n)) return s;
  return n.toLocaleString('ko-KR');
}

export default function Users() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    setLoading(true);
    setError(null);
    const { data, error: e } = await adminApi.getUsers({
      user_id: query.trim() || undefined,
      limit: '100',
    });
    setLoading(false);
    if (e) {
      setError(e.message);
      setItems([]);
      return;
    }
    setItems(data?.items ?? []);
  };

  useEffect(() => {
    if (!query.trim()) {
      search();
    }
  }, []);

  return (
    <>
      <h1 className="page-title">사용자 및 계정</h1>

      <div className="card">
        <div className="form-row">
          <label>사용자 ID 검색 (부분 일치)</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="예: U1"
            />
            <button type="button" className="btn btn-primary" onClick={search} disabled={loading}>
              {loading ? '검색 중…' : '검색'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="msg-error">{error}</div>}

      <div className="card">
        {items.length === 0 && !loading && (
          <p className="empty">계정이 없습니다. 수동 발급으로 먼저 계정을 만드세요.</p>
        )}
        {items.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>사용자 ID</th>
                  <th>잔액</th>
                  <th>예약</th>
                  <th>상태</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.account_id}>
                    <td>{a.user_id}</td>
                    <td>{formatAmount(a.balance)} PP</td>
                    <td>{formatAmount(a.reserved_balance)} PP</td>
                    <td>{a.status}</td>
                    <td>
                      <Link to={`/accounts/${encodeURIComponent(a.user_id)}`} className="link">
                        상세
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
