/**
 * 디지털 상품권 스토어 — 포인트로 구매 가능한 상품권 목록 및 구매(Spend)
 * 상품권 데이터는 MVP에서 목업; 실제 연동 시 API/DB 사용
 */
import { useState, useEffect } from 'react';
import { api } from '../api/client';

export interface VoucherProduct {
  id: string;
  name: string;
  description: string;
  pricePP: number;
  image?: string;
}

const MOCK_VOUCHERS: VoucherProduct[] = [
  { id: 'V_COFFEE_5K', name: '카페 5,000원권', description: '제휴 카페에서 현금처럼 사용', pricePP: 5000 },
  { id: 'V_FOOD_10K', name: '식품 10,000원권', description: '제휴 식품매장 사용 가능', pricePP: 10000 },
  { id: 'V_BOOK_15K', name: '도서 15,000원권', description: '가맹 서점에서 사용', pricePP: 15000 },
];

const DEFAULT_USER = 'U1';

function formatAmount(n: number): string {
  return n.toLocaleString('ko-KR');
}

export default function VoucherStore() {
  const [userId, setUserId] = useState(DEFAULT_USER);
  const [balance, setBalance] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fetchBalance = () => {
    api.getBalance(userId).then(({ data }) => {
      if (data) setBalance(data.available);
    });
  };

  useEffect(() => {
    fetchBalance();
  }, [userId]);

  const handlePurchase = async (v: VoucherProduct) => {
    setMessage(null);
    setPurchasingId(v.id);
    const { data, error } = await api.spend({
      user_id: userId,
      amount: String(v.pricePP),
      order_id: `VOUCHER_${v.id}_${Date.now()}`,
    });
    setPurchasingId(null);
    if (error) {
      setMessage({ type: 'err', text: error.message });
      return;
    }
    if (data) {
      setMessage({ type: 'ok', text: `"${v.name}" 구매 완료. 영수증 ID: ${data.receiptId}` });
      fetchBalance();
    }
  };

  const available = balance != null ? Number(balance) : 0;

  return (
    <>
      <h1 className="page-title">디지털 상품권 스토어</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        PayPoint로 디지털 상품권을 구매해 사용할 수 있습니다.{' '}
        <span className="demo-pill" title="상품 목록은 MVP 목업; 결제는 Spend API 연동">
          데모 상품
        </span>
      </p>

      <div className="card">
        <label className="card-title">사용자 ID</label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          onBlur={() => fetchBalance()}
          placeholder="예: U1"
          style={{ marginBottom: 0, padding: '0.65rem 0.85rem', width: '100%', maxWidth: '200px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)' }}
        />
        {balance != null && (
          <p style={{ marginTop: '0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
            보유: {formatAmount(available)} PP
          </p>
        )}
      </div>

      {message && (
        <div className={message.type === 'ok' ? 'msg-success' : 'msg-error'}>{message.text}</div>
      )}

      <div className="voucher-grid">
        {MOCK_VOUCHERS.map((v) => {
          const canBuy = available >= v.pricePP;
          return (
            <div key={v.id} className="card voucher-card">
              <div className="voucher-name">{v.name}</div>
              <p className="voucher-desc">{v.description}</p>
              <p className="voucher-price">{formatAmount(v.pricePP)} PP</p>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!canBuy || purchasingId !== null}
                onClick={() => handlePurchase(v)}
              >
                {purchasingId === v.id ? '처리 중…' : canBuy ? '포인트로 구매' : '잔액 부족'}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
