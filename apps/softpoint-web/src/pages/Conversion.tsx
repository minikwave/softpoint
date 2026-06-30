import { useState } from 'react';
import { api } from '../api/client';

const DEFAULT_USER = 'U1';

export default function Conversion() {
  const [userId, setUserId] = useState(DEFAULT_USER);
  const [amount, setAmount] = useState('');
  const [toAsset, setToAsset] = useState('USDC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; status: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    const amt = amount.trim();
    if (!amt) {
      setError('금액을 입력하세요.');
      return;
    }
    const n = Number(amt);
    if (Number.isNaN(n) || n <= 0) {
      setError('금액은 0보다 큰 숫자여야 합니다.');
      return;
    }
    setLoading(true);
    const { data, error: e2 } = await api.requestConversion({
      user_id: userId,
      type: 'MERCHANT_SETTLEMENT',
      from_amount: String(Math.floor(n)),
      to_asset: toAsset,
    });
    setLoading(false);
    if (e2) {
      setError(e2.message);
      return;
    }
    if (data) {
      setResult({ id: data.id, status: data.status });
      setAmount('');
    }
  };

  return (
    <>
      <h1 className="page-title">정산 옵션 (Stable)</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        SP를 스테이블코인 정산으로 전환 요청합니다. 승인·실행은 운영 콘솔에서 처리됩니다.
      </p>

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label>사용자 ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="U1"
            required
          />
        </div>
        <div className="form-group">
          <label>전환 금액 (PP)</label>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="예: 10000"
            required
          />
        </div>
        <div className="form-group">
          <label>정산 자산</label>
          <select
            value={toAsset}
            onChange={(e) => setToAsset(e.target.value)}
            style={{ maxWidth: 200, padding: '0.65rem 0.85rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)' }}
          >
            <option value="USDC">USDC</option>
            <option value="USDT">USDT</option>
          </select>
        </div>
        {error && <div className="msg-error">{error}</div>}
        {result && (
          <div className="msg-success">
            요청 접수됨 — ID: {result.id.slice(0, 8)}…, 상태: {result.status}. 운영자 승인 후 정산됩니다.
          </div>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '요청 중…' : '전환 요청'}
        </button>
      </form>
    </>
  );
}
