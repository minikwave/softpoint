import { Routes, Route, NavLink, Navigate, Outlet, Link } from 'react-router-dom';
import Landing from './pages/Landing';
import Product from './pages/Product';
import Developers from './pages/Developers';
import Balance from './pages/Balance';
import Transactions from './pages/Transactions';
import Spend from './pages/Spend';
import Conversion from './pages/Conversion';
import Store from './pages/Store';
import VoucherStore from './pages/VoucherStore';
import EarnHistory from './pages/EarnHistory';
import EarnMap from './pages/EarnMap';
import Wallet from './pages/Wallet';
import './App.css';

function AppNav() {
  const link = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <NavLink
      to={to}
      className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`}
    >
      {children}
    </NavLink>
  );
  return (
    <nav className="nav" aria-label="디앱 메뉴">
      <div className="nav-brand-row">
        <Link to="/" className="nav-brand" title="랜딩으로">
          쌓음
        </Link>
        <span className="nav-app-label">디앱</span>
      </div>
      <div className="nav-links">
        {link({ to: '/app/balance', children: '잔액' })}
        {link({ to: '/app/wallet', children: '지갑' })}
        {link({ to: '/app/transactions', children: '내역' })}
        {link({ to: '/app/earn-history', children: '적립 내역' })}
        {link({ to: '/app/earn-map', children: '적립 장소' })}
        {link({ to: '/app/vouchers', children: '상품권' })}
        {link({ to: '/app/spend', children: '결제' })}
        {link({ to: '/app/conversion', children: '정산 옵션' })}
        {link({ to: '/app/store', children: '가게' })}
      </div>
    </nav>
  );
}

function AppLayout() {
  return (
    <div className="app app-dapp">
      <AppNav />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/product" element={<Product />} />
      <Route path="/developers" element={<Developers />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="/app/balance" replace />} />
        <Route path="balance" element={<Balance />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="earn-history" element={<EarnHistory />} />
        <Route path="earn-map" element={<EarnMap />} />
        <Route path="vouchers" element={<VoucherStore />} />
        <Route path="spend" element={<Spend />} />
        <Route path="conversion" element={<Conversion />} />
        <Route path="store" element={<Store />} />
      </Route>
    </Routes>
  );
}
