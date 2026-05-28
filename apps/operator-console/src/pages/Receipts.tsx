import { useState, useCallback } from 'react';
import { adminApi, type AdminReceiptItem } from '../api/client';

export default function Receipts() {
  const [status, setStatus] = useState('');
  const [userId, setUserId] = useState('');
  const [intentType, setIntentType] = useState('');
  const [items, setItems] = useState<AdminReceiptItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: e } = await adminApi.getReceipts({
      status: status.trim() || undefined,
      user_id: userId.trim() || undefined,
      intent_type: intentType.trim() || undefined,
      limit: '100',
    });
    setLoading(false);
    if (e) {
      setError(e.message);
      setItems([]);
      return;
    }
    setItems(data?.items ?? []);
  }, [status, userId, intentType]);

  return (
    <>
      <h1 className="page-title">영수증 (Receipts)</h1>
      <div className="card">
        <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div>
            <label>status</label>
            <input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="COMPLETED" />
          </div>
          <div>
            <label>user_id</label>
            <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="U1" />
          </div>
          <div>
            <label>intent_type</label>
            <input value={intentType} onChange={(e) => setIntentType(e.target.value)} placeholder="REDEEM" />
          </div>
          <button type="button" className="btn btn-primary" onClick={load} disabled={loading}>
            조회
          </button>
        </div>
      </div>
      {error && <div className="msg-error">{error}</div>}
      <div className="card">
        {loading && <p className="loading">조회 중…</p>}
        {!loading && items.length === 0 && <p className="empty">결과 없음. 조회를 눌러주세요.</p>}
        {!loading && items.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>상태</th>
                  <th>유형</th>
                  <th>금액</th>
                  <th>사용자</th>
                  <th>ID</th>
                  <th>일시</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td><span className="badge">{r.status}</span></td>
                    <td>{r.intentType}</td>
                    <td>{Number(r.amount).toLocaleString('ko-KR')} PP</td>
                    <td>{r.userId}</td>
                    <td className="mono-small">{r.id.slice(0, 8)}…</td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(r.createdAt).toLocaleString('ko-KR')}</td>
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
