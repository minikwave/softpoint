/**
 * Mock data: 적립 가능 장소 (실제 연동 시 API/DB에서 로드)
 */
export interface EarnPlace {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  earnRate?: string; // e.g. "1%"
}

export const MOCK_EARN_PLACES: EarnPlace[] = [
  { id: '1', name: '달콤카페 강남점', category: '카페', address: '서울 강남구 테헤란로 123', lat: 37.5012, lng: 127.0396, earnRate: '1%' },
  { id: '2', name: '편의점페이 역삼점', category: '편의점', address: '서울 강남구 역삼동 456', lat: 37.5001, lng: 127.0364, earnRate: '0.5%' },
  { id: '3', name: '헬스푸드 선릉', category: '식품', address: '서울 강남구 선릉로 789', lat: 37.5045, lng: 127.0489, earnRate: '2%' },
  { id: '4', name: '책방쌓음 코리아', category: '서점', address: '서울 서초구 서초동 101', lat: 37.4833, lng: 127.0322, earnRate: '1%' },
];

function formatCoord(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export default function EarnMap() {
  const places = MOCK_EARN_PLACES;

  return (
    <>
      <h1 className="page-title">적립 가능 장소</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        PayPoint를 적립할 수 있는 가맹점을 찾아보세요.
      </p>

      <div className="card map-card">
        <p className="card-title">지도</p>
        <a
          href={`https://www.openstreetmap.org/?mlat=${places[0]?.lat ?? 37.5}&mlon=${places[0]?.lng ?? 127}&zoom=14`}
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
        <ul className="place-list">
          {places.map((p) => (
            <li key={p.id} className="place-item">
              <div className="place-name">{p.name}</div>
              <div className="place-meta">{p.category} · {p.earnRate ?? '-'} 적립</div>
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
      </div>
    </>
  );
}
