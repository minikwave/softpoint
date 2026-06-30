import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, type CreditProductItem } from '../api/client';

const DEFAULT_USER = 'U1';

function formatAmount(s: string): string {
  const n = Number(s);
  return Number.isNaN(n) ? s : n.toLocaleString('ko-KR');
}

export default function VoucherStore() {
  const [userId, setUserId] = useState(DEFAULT_USER);
  const [products, setProducts] = useState<CreditProductItem[]>([]);
  const [category, setCategory] = useState('');
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getCreditProducts(category || undefined).then(({ data, error }) => {
      if (cancelled) return;
      setLoading(false);
      if (error) {
        setProducts([]);
        return;
      }
      setProducts(data?.items ?? []);
    });
    return () => { cancelled = true; };
  }, [category]);

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[];

  const handleRedeem = async (product: CreditProductItem) => {
    setMessage(null);
    setPurchasingId(product.id);
    const key = `redeem:${userId}:${product.id}:${Date.now()}`;
    const { data, error } = await api.redeemProduct({
      user_id: userId,
      product_id: product.id,
      idempotency_key: key,
    });
    setPurchasingId(null);
    if (error) {
      setMessage({ type: 'err', text: error.message });
      return;
    }
    if (data) {
      setMessage({
        type: 'ok',
        text: `교환 완료 — 코드: ${data.codeDisplay ?? '(발급됨)'}. 영수증 ${data.receiptId.slice(0, 8)}…`,
      });
      fetchBalance();
    }
  };

  return (
    <>
      <h1 className="page-title">디지털 상품권 스토어</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        PayPoint로 기프티콘·게임머니·AI 크레딧을 교환합니다. <Link to="/app/my-credits">내 교환 내역</Link>
      </p>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label>사용자 ID</label>
          <input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} />
        </div>
        {balance != null && (
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            사용 가능: <strong>{formatAmount(balance)} PP</strong>
          </p>
        )}
        <div className="form-group" style={{ marginTop: '0.75rem' }}>
          <label>카테고리</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">전체</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div className={message.type === 'ok' ? 'msg-success' : 'msg-error'} style={{ marginBottom: '1rem' }}>
          {message.text}
        </div>
      )}

      {loading && <p className="loading">상품 불러오는 중…</p>}

      {!loading && (
        <div className="voucher-grid">
          {products.map((p) => (
            <div key={p.id} className="voucher-card card">
              <div className="voucher-name">{p.name}</div>
              <div className="voucher-desc">{p.description ?? p.product_type}</div>
              <div className="voucher-price">{formatAmount(p.price_paypoint)} PP</div>
              <div className="place-meta" style={{ marginBottom: '0.5rem' }}>
                {p.category ?? p.product_type}
              </div>
              <button
                type="button"
                className="btn btn-primary"
                disabled={purchasingId === p.id}
                onClick={() => handleRedeem(p)}
              >
                {purchasingId === p.id ? '교환 중…' : '교환하기'}
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <p className="empty">상품이 없습니다. API 시드(<code>pnpm db:seed</code>)를 실행하세요.</p>
      )}
    </>
  );
}
