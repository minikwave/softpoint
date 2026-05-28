import { useState, useEffect } from 'react';
import { api } from '../api/client';

const DEFAULT_STORE_ID = 'STORE_01';

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
  if (s === 'requested') return 'badge-spend';
  if (s === 'authorized' || s === 'executing') return 'badge-issue';
  if (s === 'settled') return 'badge-issue';
  if (s === 'failed') return 'badge-adjust';
  return '';
}

export default function Store() {
  const [storeId, setStoreId] = useState(DEFAULT_STORE_ID);
  const [amount, setAmount] = useState('');
  const [toAsset, setToAsset] = useState('USDC');
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Array<{ id: string; type: string; fromAmount: string; toAsset: string; status: string; createdAt: string; txHash?: string; settlementRef?: string }>>([]);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchList = async () => {
    setListLoading(true);
    const { data } = await api.getConversions(storeId);
    setListLoading(false);
    if (data?.items) setList(data.items);
  };

  useEffect(() => {
    fetchList();
  }, [storeId]);

  const handleRequestSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
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
      user_id: storeId,
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
      setSuccess('정산 요청이 접수되었습니다. 운영자 승인 후 처리됩니다.');
      setAmount('');
      fetchList();
    }
  };

  return (
    <>
      <h1 className="page-title">가게 관리 (리테일)</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        가맹점 ID로 정산 요청을 넣고, 실제 정산금 유입 과정을 확인합니다.
      </p>

      <div className="card settlement-flow-card">
        <p className="card-title">실제 정산금이 들어오는 과정</p>
        <ol className="settlement-steps">
          <li><strong>정산 요청 (REQUESTED)</strong> — PayPoint 잔액을 스테이블코인(USDC/USDT)으로 정산해 달라고 요청합니다.</li>
          <li><strong>승인 (AUTHORIZED)</strong> — 운영자가 승인하면 해당 금액이 예약(lock)됩니다. 아직 실제 입금은 아닙니다.</li>
          <li><strong>실행 (EXECUTING)</strong> — Conversion Router가 스테이블코인 전환을 실행합니다.</li>
          <li><strong>정산 완료 (SETTLED)</strong> — 전환이 완료되면 실제 정산금(스테이블코인)이 지정 주소/계정으로 입금됩니다. 이 단계에서 “실제 정산금 유입”이 완료됩니다.</li>
          <li><strong>실패 (FAILED)</strong> — 전환 실패 시 예약이 해제되고, 요청만 취소됩니다.</li>
        </ol>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
          아래 목록에서 각 요청의 상태를 확인할 수 있습니다. SETTLED 건은 정산금이 이미 유입된 것입니다.
        </p>
      </div>

      <div className="card">
        <p className="card-title">가맹점 ID</p>
        <input
          type="text"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          placeholder="STORE_01"
          style={{ marginBottom: 0, padding: '0.65rem 0.85rem', width: '100%', maxWidth: '200px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)' }}
        />
      </div>

      <div className="card">
        <p className="card-title">정산 요청 (PayPoint → Stable)</p>
        <form onSubmit={handleRequestSettlement}>
          <div className="form-group">
            <label>전환 금액 (PP)</label>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="예: 10000"
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
          {success && <div className="msg-success">{success}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '요청 중…' : '정산 요청'}
          </button>
        </form>
      </div>

      <div className="card">
        <p className="card-title">내 전환 요청 목록 (정산 현황)</p>
        {!listLoading && list.length > 0 && (
          <div className="settlement-summary">
            <span>총 요청: {list.length}건</span>
            <span>정산 완료: {list.filter((c) => c.status === 'SETTLED').length}건</span>
            <span>대기/진행: {list.filter((c) => ['REQUESTED', 'AUTHORIZED', 'EXECUTING'].includes(c.status)).length}건</span>
          </div>
        )}
        {listLoading && <p className="loading">조회 중…</p>}
        {!listLoading && list.length === 0 && (
          <p className="empty">전환 요청이 없습니다.</p>
        )}
        {!listLoading && list.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>유형</th>
                  <th>금액</th>
                  <th>자산</th>
                  <th>상태</th>
                  <th>정산 완료 시 입금 정보</th>
                  <th>일시</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id}>
                    <td>{c.type}</td>
                    <td>{formatAmount(c.fromAmount)} PP</td>
                    <td>{c.toAsset}</td>
                    <td><span className={`badge ${statusBadge(c.status)}`}>{c.status}</span></td>
                    <td>
                      {c.status === 'SETTLED' && (c.txHash || c.settlementRef) ? (
                        <span className="settled-info">
                          {c.txHash && <>tx: {c.txHash.slice(0, 10)}…</>}
                          {c.settlementRef && <> · ref: {c.settlementRef}</>}
                        </span>
                      ) : c.status === 'SETTLED' ? (
                        '입금 완료'
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{formatDate(c.createdAt)}</td>
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
