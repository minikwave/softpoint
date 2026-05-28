import { useState } from 'react';
import { api } from '../api/client';

const DEFAULT_USER = 'U1';

export default function Spend() {
  const [userId, setUserId] = useState(DEFAULT_USER);
  const [amount, setAmount] = useState('');
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    receiptId: string;
    amount: string;
    paymentEarn?: { amount: string; policyId: string; policyVersion: string };
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    const amt = amount.trim();
    const oid = orderId.trim();
    if (!amt || !oid) {
      setError('금액과 주문 ID를 입력하세요.');
      return;
    }
    const n = Number(amt);
    if (Number.isNaN(n) || n <= 0) {
      setError('금액은 0보다 큰 숫자여야 합니다.');
      return;
    }
    setLoading(true);
    const { data, error: e2 } = await api.spend({
      user_id: userId,
      amount: String(Math.floor(n)),
      order_id: oid,
    });
    setLoading(false);
    if (e2) {
      setError(e2.message);
      return;
    }
    if (data) {
      setResult({
        receiptId: data.receiptId,
        amount: data.amount,
        paymentEarn: data.paymentEarn ?? undefined,
      });
      setAmount('');
      setOrderId('');
    }
  };

  return (
    <>
      <h1 className="page-title">결제 (PayPoint 사용)</h1>

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
          <label>금액 (PP)</label>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="예: 2000"
            required
          />
        </div>
        <div className="form-group">
          <label>주문 ID</label>
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="예: ORDER_001"
            required
          />
        </div>
        {error && <div className="msg-error">{error}</div>}
        {result && (
          <div className="msg-success">
            결제 완료 — 영수증 ID: {result.receiptId}, 차감: {Number(result.amount).toLocaleString('ko-KR')} PP
            {result.paymentEarn && (
              <div style={{ marginTop: '0.5rem' }}>
                결제 적립: +{Number(result.paymentEarn.amount).toLocaleString('ko-KR')} PP
                {' '}(정책 {result.paymentEarn.policyId} v{result.paymentEarn.policyVersion})
              </div>
            )}
          </div>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '처리 중…' : '결제하기'}
        </button>
      </form>
    </>
  );
}
