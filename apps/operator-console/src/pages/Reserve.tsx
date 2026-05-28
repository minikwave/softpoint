import { useEffect, useState } from 'react';
import { adminApi, type ReserveRes } from '../api/client';

function fmt(s: string): string {
  const n = Number(s);
  return Number.isNaN(n) ? s : n.toLocaleString('ko-KR');
}

export default function Reserve() {
  const [data, setData] = useState<ReserveRes | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getReserve().then(({ data: d, error: e }) => {
      if (e) setError(e.message);
      else setData(d ?? null);
    });
  }, []);

  return (
    <>
      <h1 className="page-title">준비금·부채 스냅샷</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        사용자에게 보이는 PayPoint 합계(미사용 부채)입니다. 은행·온체인 대사는 별도 워커가 필요합니다.
      </p>
      {error && <div className="msg-error">{error}</div>}
      {data && (
        <div className="card">
          <dl className="detail-dl" style={{ display: 'grid', gridTemplateColumns: '10rem 1fr', gap: '0.5rem' }}>
            <dt>총 잔액</dt>
            <dd>{fmt(data.total_balance)} PP</dd>
            <dt>예약(전환 등)</dt>
            <dd>{fmt(data.total_reserved)} PP</dd>
            <dt>계정 수</dt>
            <dd>{data.account_count}</dd>
            <dt>누적 ISSUE 합</dt>
            <dd>{fmt(data.total_issued)} PP</dd>
            <dt>누적 SPEND 합</dt>
            <dd>{fmt(data.total_spent)} PP</dd>
            <dt>교환 완료 건수</dt>
            <dd>{data.redemption_fulfilled_count}</dd>
            <dt>열린 예외</dt>
            <dd>{data.open_exceptions}</dd>
            <dt>기준 시각</dt>
            <dd>{new Date(data.as_of).toLocaleString('ko-KR')}</dd>
          </dl>
        </div>
      )}
    </>
  );
}
