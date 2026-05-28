import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi, type AdminAccountRes } from '../api/client';

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

function typeBadge(type: string): string {
  const t = type.toLowerCase();
  if (t === 'issue') return 'badge-issue';
  if (t === 'spend') return 'badge-spend';
  if (t === 'expire') return 'badge-expire';
  if (t === 'adjust') return 'badge-adjust';
  return '';
}

export default function Account() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<AdminAccountRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [issueAmount, setIssueAmount] = useState('');
  const [issueReason, setIssueReason] = useState('');
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [issueSuccess, setIssueSuccess] = useState(false);

  const fetchAccount = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    const { data, error: e } = await adminApi.getAccount(userId);
    setLoading(false);
    if (e) {
      setError(e.message);
      setAccount(null);
      return;
    }
    setAccount(data ?? null);
  };

  useEffect(() => {
    fetchAccount();
  }, [userId]);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const amt = issueAmount.trim();
    const reason = issueReason.trim();
    if (!amt || !reason) {
      setIssueError('금액과 사유를 입력하세요.');
      return;
    }
    const n = Number(amt);
    if (Number.isNaN(n) || n <= 0) {
      setIssueError('금액은 0보다 큰 숫자여야 합니다.');
      return;
    }
    setIssueSubmitting(true);
    setIssueError(null);
    setIssueSuccess(false);
    const { data, error: err } = await adminApi.issueCredit({
      user_id: userId,
      amount: String(Math.floor(n)),
      reason,
      actor_id: 'console',
      actor_role: 'Ops Admin',
    });
    setIssueSubmitting(false);
    if (err) {
      setIssueError(err.message);
      return;
    }
    if (data) {
      setIssueSuccess(true);
      setIssueAmount('');
      setIssueReason('');
      fetchAccount();
    }
  };

  if (!userId) return null;

  return (
    <>
      <p style={{ marginBottom: '1rem' }}>
        <button type="button" className="btn" onClick={() => navigate('/')} style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
          ← 목록
        </button>
      </p>
      <h1 className="page-title">계정: {userId}</h1>

      {loading && <p className="loading">조회 중…</p>}
      {error && <div className="msg-error">{error}</div>}

      {!loading && account && (
        <>
          <div className="card">
            <p className="card-title">잔액</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--accent)' }}>
              {formatAmount(account.available)} PP (가용)
            </p>
            <p className="card-title" style={{ marginTop: '0.75rem' }}>총 잔액 / 예약</p>
            <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {formatAmount(account.balance)} PP / {formatAmount(account.reserved_balance)} PP
            </p>
          </div>

          <div className="card">
            <p className="card-title">수동 발급</p>
            <form onSubmit={handleIssue}>
              <div className="form-row">
                <label>금액 (PP)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={issueAmount}
                  onChange={(e) => setIssueAmount(e.target.value)}
                  placeholder="예: 5000"
                />
              </div>
              <div className="form-row">
                <label>사유</label>
                <input
                  type="text"
                  value={issueReason}
                  onChange={(e) => setIssueReason(e.target.value)}
                  placeholder="예: 프로모션, CS 보상"
                />
              </div>
              {issueError && <div className="msg-error">{issueError}</div>}
              {issueSuccess && <div className="msg-success">발급 완료. 잔액이 반영되었습니다.</div>}
              <button type="submit" className="btn btn-primary" disabled={issueSubmitting}>
                {issueSubmitting ? '처리 중…' : '발급'}
              </button>
            </form>
          </div>

          <div className="card">
            <p className="card-title">타임라인 (최근 50건)</p>
            {account.timeline.length === 0 ? (
              <p className="empty">거래 내역이 없습니다.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>유형</th>
                      <th>금액</th>
                      <th>주문 ID</th>
                      <th>일시</th>
                    </tr>
                  </thead>
                  <tbody>
                    {account.timeline.map((t) => (
                      <tr key={t.tx_id}>
                        <td><span className={`badge ${typeBadge(t.type)}`}>{t.type}</span></td>
                        <td>{formatAmount(t.amount)} PP</td>
                        <td>{t.order_id ?? '—'}</td>
                        <td>{formatDate(t.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
