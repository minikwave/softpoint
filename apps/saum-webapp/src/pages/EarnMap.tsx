import { useState, useEffect, useMemo } from 'react';
import { api, type EarnLocationItem } from '../api/client';

function formatCoord(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export default function EarnMap() {
  const [places, setPlaces] = useState<EarnLocationItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [appliedCategory, setAppliedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getEarnLocations(appliedCategory ? { category: appliedCategory } : undefined)
      .then(({ data, error: e }) => {
        if (cancelled) return;
        setLoading(false);
        if (e) {
          setError(e.message);
          setPlaces([]);
          return;
        }
        setPlaces(data?.items ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [appliedCategory]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const p of places) s.add(p.category);
    return [...s].sort();
  }, [places]);

  const first = places[0];

  const applyCategory = () => setAppliedCategory(categoryFilter.trim());
  const clearCategory = () => {
    setCategoryFilter('');
    setAppliedCategory('');
  };

  return (
    <>
      <h1 className="page-title">적립 가능 장소</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        PayPoint를 적립할 수 있는 가맹점 목록입니다. 데이터는 API(<code>/v1/paypoint/earn-locations</code>)에서 불러옵니다.
      </p>

      <div className="card">
        <p className="card-title">카테고리 필터 (선택)</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            list="earn-cat-suggest"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyCategory()}
            placeholder="예: 카페"
            style={{ padding: '0.65rem 0.85rem', minWidth: '160px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)' }}
          />
          <datalist id="earn-cat-suggest">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <button type="button" className="btn btn-primary" onClick={applyCategory}>
            적용
          </button>
          <button type="button" className="btn" onClick={clearCategory}>
            초기화
          </button>
        </div>
        {appliedCategory ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            적용 중: <strong>{appliedCategory}</strong>
          </p>
        ) : null}
      </div>

      {loading && <p className="loading">불러오는 중…</p>}
      {error && <div className="msg-error">{error}</div>}

      {!loading && !error && (
        <>
          <div className="card map-card">
            <p className="card-title">지도</p>
            <a
              href={`https://www.openstreetmap.org/?mlat=${first?.lat ?? 37.5}&mlon=${first?.lng ?? 127}&zoom=14`}
              target="_blank"
              rel="noopener noreferrer"
              className="map-placeholder"
            >
              지도에서 보기 (OpenStreetMap)
            </a>
            <p className="card-title" style={{ marginTop: '1rem' }}>좌표 기반으로 외부 지도에서 위치를 확인할 수 있습니다.</p>
          </div>

          <div className="card">
            <p className="card-title">장소 목록</p>
            {places.length === 0 ? (
              <p className="empty">등록된 장소가 없습니다. API DB에 시드가 있는지 확인하세요 (<code>pnpm db:push</code> 후 <code>pnpm --filter paypoint-api run db:seed</code>).</p>
            ) : (
              <ul className="place-list">
                {places.map((p) => (
                  <li key={p.id} className="place-item">
                    <div className="place-name">{p.name}</div>
                    <div className="place-meta">
                      {p.category} · {p.earn_rate ?? '-'} 적립
                    </div>
                    <div className="place-address">{p.address}</div>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}&zoom=17`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="place-map-link"
                    >
                      지도 보기 ({formatCoord(p.lat, p.lng)})
                    </a>
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
