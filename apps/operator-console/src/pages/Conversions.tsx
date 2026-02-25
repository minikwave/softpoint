import { useState, useEffect } from 'react';
import { adminApi, type ConversionItem } from '../api/client';

function formatAmount(s: string): string {
  const n = Number(s);
  if (Number.isNaN(n)) return s;
  return n.toLocaleString('ko-KR');
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return iso;
  }
}

function statusBadge(status: string): string {
  const s = status.toLowerCase();
  if (s === 'requested') return 'badge-issue';
  if (s === 'authorized' || s === 'executing') return 'badge-spend';
  if (s === 'settled') return 'badge-issue';
  if (s === 'failed') return 'badge-adjust';
  return '';
}

export default function Conversions() {
  const [statusFilter, setStatusFilter] = useState('');
  const [items, setItems] = useState<ConversionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    const { data, error: e } = await adminApi.getConversions({
      status: statusFilter || undefined,
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
    fetchList();
  }, [statusFilter]);

  const runAction = async (
    id: string,
    action: 'approve' | 'settle' | 'fail'
  ) => {
    setActionLoading(id);
    setMessage(null);
    const fn =
      action === 'approve'
        ? adminApi.approveConversion(id)
        : action === 'settle'
          ? adminApi.settleConversion(id)
          : adminApi.failConversion(id);
    const { data, error: e } = await fn;
    setActionLoading(null);
    if (e) {
      setMessage({ type: 'err', text: e.message });
      return;
    }
    if (data) {
      setMessage({ type: 'ok', text: action === 'approve' ? '승인됨 (잔액 예약)' : action === 'settle' ? '정산 완료' : '실패 처리됨 (예약 해제)' });
      fetchList();
    }
  };

  return (
    <>
      <h1 className="page-title">전환 (PayPoint → Stable)</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        REQUESTED → 승인 시 잔액 예약 → 정산 시 차감 확정. 실패 시 예약만 해제.
      </p>

      <div className="card">
        <div className="form-row">
          <label>상태 필터</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ maxWidth: 200, padding: '0.5rem 0.75rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)' }}
          >
            <option value="">전체</option>
            <option value="REQUESTED">REQUESTED</option>
            <option value="AUTHORIZED">AUTHORIZED</option>
            <option value="EXECUTING">EXECUTING</option>
            <option value="SETTLED">SETTLED</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      {message && (
        <div className={message.type === 'ok' ? 'msg-success' : 'msg-error'}>
          {message.text}
        </div>
      )}
      {error && <div className="msg-error">{error}</div>}

      <div className="card">
        {loading && <p className="loading">조회 중…</p>}
        {!loading && items.length === 0 && (
          <p className="empty">전환 요청이 없습니다. 사용자 앱 또는 API로 POST /v1/paypoint/conversion/request 를 호출하세요.</p>
        )}
        {!loading && items.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>사용자</th>
                  <th>유형</th>
                  <th>금액</th>
                  <th>대상 자산</th>
                  <th>상태</th>
                  <th>일시</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontSize: '0.8rem' }}>{c.id.slice(0, 8)}…</td>
                    <td>{c.user_id}</td>
                    <td>{c.type}</td>
                    <td>{formatAmount(c.from_amount)} PP</td>
                    <td>{c.to_asset}</td>
                    <td><span className={`badge ${statusBadge(c.status)}`}>{c.status}</span></td>
                    <td>{formatDate(c.created_at)}</td>
                    <td>
                      {c.status === 'REQUESTED' && (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ marginRight: 4, padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                            disabled={actionLoading !== null}
                            onClick={() => runAction(c.id, 'approve')}
                          >
                            {actionLoading === c.id ? '…' : '승인'}
                          </button>
                          <button
                            type="button"
                            className="btn"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', background: 'var(--surface)', color: 'var(--error)', border: '1px solid var(--border)' }}
                            disabled={actionLoading !== null}
                            onClick={() => runAction(c.id, 'fail')}
                          >
                            실패
                          </button>
                        </>
                      )}
                      {(c.status === 'AUTHORIZED' || c.status === 'EXECUTING') && (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ marginRight: 4, padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                            disabled={actionLoading !== null}
                            onClick={() => runAction(c.id, 'settle')}
                          >
                            {actionLoading === c.id ? '…' : '정산'}
                          </button>
                          <button
                            type="button"
                            className="btn"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', background: 'var(--surface)', color: 'var(--error)', border: '1px solid var(--border)' }}
                            disabled={actionLoading !== null}
                            onClick={() => runAction(c.id, 'fail')}
                          >
                            실패
                          </button>
                        </>
                      )}
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
