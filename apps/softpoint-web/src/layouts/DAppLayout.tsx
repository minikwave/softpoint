import { Link, NavLink, Outlet } from 'react-router-dom';

function navLink(to: string, label: string) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `dapp-nav-link${isActive ? ' active' : ''}`}
    >
      {label}
    </NavLink>
  );
}

/** 소비자·가게 디앱 전용 셸 (마케팅 헤더 없음) */
export default function DAppLayout() {
  return (
    <div className="dapp-shell">
      <header className="dapp-header">
        <div className="dapp-header-inner">
          <Link to="/" className="dapp-brand" title="SoftPoint 홈">
            SoftPoint
          </Link>
          <span className="dapp-badge">D-App</span>
          <nav className="dapp-nav" aria-label="디앱">
            {navLink('/app/balance', '잔액')}
            {navLink('/app/transactions', '내역')}
            {navLink('/app/earn-history', '적립')}
            {navLink('/app/earn-map', '장소')}
            {navLink('/app/vouchers', '상품권')}
            {navLink('/app/my-credits', '교환')}
            {navLink('/app/spend', '결제')}
            {navLink('/app/conversion', '정산')}
            {navLink('/app/store', '가게')}
          </nav>
        </div>
      </header>
      <main className="dapp-main">
        <Outlet />
      </main>
    </div>
  );
}
