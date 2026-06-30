import { useEffect, useMemo, useState } from 'react';
import { api, type EarnLocationItem } from '../api/client';

function formatCoord(lat: string, lng: string): string {
  const la = Number(lat);
  const ln = Number(lng);
  if (Number.isNaN(la) || Number.isNaN(ln)) return `${lat}, ${lng}`;
  return `${la.toFixed(4)}, ${ln.toFixed(4)}`;
}

export default function EarnMap() {
  const [places, setPlaces] = useState<EarnLocationItem[]>([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.getEarnLocations(category || undefined).then(({ data, error: e }) => {
      if (cancelled) return;
      setLoading(false);
      if (e) {
        setError(e.message);
        setPlaces([]);
        return;
      }
      setPlaces(data?.items ?? []);
    });
    return () => { cancelled = true; };
  }, [category]);

  const categories = useMemo(() => {
    const set = new Set(places.map((p) => p.category));
    return Array.from(set).sort();
  }, [places]);

  const mapCenter = places[0];

  return (
    <>
      <h1 className="page-title">적립 가능 장소</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        PayPoint를 적립할 수 있는 가맹점을 찾아보세요. (API 연동)
      </p>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label>카테고리</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">전체</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="msg-error">{error}</div>}
      {loading && <p className="loading">불러오는 중…</p>}

      {!loading && !error && (
        <>
          <div className="card map-card">
            <p className="card-title">지도</p>
            <a
              href={`https://www.openstreetmap.org/?mlat=${mapCenter?.lat ?? 37.5}&mlon=${mapCenter?.lng ?? 127}&zoom=14`}
              target="_blank"
              rel="noopener noreferrer"
              className="map-placeholder"
            >
              지도에서 보기 (OpenStreetMap)
            </a>
          </div>

          <div className="card">
            <p className="card-title">장소 목록 ({places.length})</p>
            {places.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>
                등록된 장소가 없습니다. <code>pnpm db:seed</code>로 시드 데이터를 넣을 수 있습니다.
              </p>
            ) : (
              <ul className="place-list">
                {places.map((p) => (
                  <li key={p.id} className="place-item">
                    <div className="place-name">{p.name}</div>
                    <div className="place-meta">{p.category} · {p.earn_rate ?? '-'} 적립</div>
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
