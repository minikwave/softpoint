import { useEffect, useState } from 'react';
import { adminApi, type DashboardRes } from '../api/client';

function fmt(s: string): string {
  const n = Number(s);
  return Number.isNaN(n) ? s : n.toLocaleString('ko-KR');
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardRes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard().then(({ data: d, error: e }) => {
      setLoading(false);
      if (e) {
        setError(e.message);
        return;
      }
      setData(d ?? null);
    });
  }, []);

  return (
    <>
      <h1 className="page-title">운영 대시보드</h1>
      {loading && <p className="loading">불러오는 중…</p>}
      {error && <div className="msg-error">{error}</div>}
      {data && (
        <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          <div>
            <div className="card-title">총 잔액 (부채)</div>
            <strong>{fmt(data.total_balance)} PP</strong>
          </div>
          <div>
            <div className="card-title">예약</div>
            <strong>{fmt(data.total_reserved)} PP</strong>
          </div>
          <div>
            <div className="card-title">계정 수</div>
            <strong>{data.account_count}</strong>
          </div>
          <div>
            <div className="card-title">누적 발행</div>
            <strong>{fmt(data.total_issued)} PP</strong>
          </div>
          <div>
            <div className="card-title">누적 사용</div>
            <strong>{fmt(data.total_spent)} PP</strong>
          </div>
          <div>
            <div className="card-title">교환 완료</div>
            <strong>{data.redemption_fulfilled_count}건</strong>
          </div>
          <div>
            <div className="card-title">열린 예외</div>
            <strong>{data.open_exceptions}건</strong>
          </div>
          <div>
            <div className="card-title">대기 전환</div>
            <strong>{data.pending_conversions}건</strong>
          </div>
          <p style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            기준 시각: {new Date(data.as_of).toLocaleString('ko-KR')}
          </p>
        </div>
      )}
    </>
  );
}
