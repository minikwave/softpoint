import { Outlet } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';

/** 마케팅 사이트: 랜딩·제품·개발자 문서 (디앱과 UI·라우트 분리) */
export default function MarketingLayout() {
  return (
    <div className="marketing-shell">
      <SiteHeader />
      <Outlet />
    </div>
  );
}
