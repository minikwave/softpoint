import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type ReceiptEventItem, type ReceiptRecord } from '../api/client';

export default function ReceiptDetail() {
  const { id } = useParams<{ id: string }>();
  const [receipt, setReceipt] = useState<ReceiptRecord | null>(null);
  const [events, setEvents] = useState<ReceiptEventItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([api.getReceipt(id), api.getReceiptEvents(id)]).then(([r, ev]) => {
      if (cancelled) return;
      setLoading(false);
      if (r.error) {
        setError(r.error.message);
        return;
      }
      setReceipt(r.data ?? null);
      setEvents(ev.data?.items ?? []);
    });
    return () => { cancelled = true; };
  }, [id]);

  if (!id) return <p className="msg-error">영수증 ID가 없습니다.</p>;

  return (
    <>
      <p style={{ marginBottom: '0.5rem' }}>
        <Link to="/app/transactions">← 내역</Link>
      </p>
      <h1 className="page-title">영수증 상세</h1>

      {loading && <p className="loading">불러오는 중…</p>}
      {error && <div className="msg-error">{error}</div>}

      {receipt && (
        <>
          <div className="card">
            <p className="card-title">요약</p>
            <dl className="detail-dl">
              <dt>ID</dt>
              <dd className="mono-small">{receipt.id}</dd>
              <dt>유형</dt>
              <dd><span className="badge">{receipt.intentType}</span></dd>
              <dt>상태</dt>
              <dd><span className="badge">{receipt.status}</span></dd>
              <dt>금액</dt>
              <dd>{Number(receipt.amount).toLocaleString('ko-KR')} PP</dd>
              <dt>사용자</dt>
              <dd>{receipt.userId}</dd>
              <dt>생성</dt>
              <dd>{new Date(receipt.createdAt).toLocaleString('ko-KR')}</dd>
            </dl>
          </div>

          <div className="card">
            <p className="card-title">타임라인</p>
            {events.length === 0 ? (
              <p className="empty">이벤트 없음</p>
            ) : (
              <ul className="place-list">
                {events.map((e) => (
                  <li key={e.id} className="place-item">
                    <div className="place-name">{e.type}</div>
                    <div className="place-meta">{new Date(e.createdAt).toLocaleString('ko-KR')}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </>
  );
}
