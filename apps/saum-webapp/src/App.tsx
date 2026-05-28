import { Routes, Route, NavLink, Navigate, Outlet } from 'react-router-dom';
import Landing from './pages/Landing';
import Balance from './pages/Balance';
import Transactions from './pages/Transactions';
import Spend from './pages/Spend';
import Conversion from './pages/Conversion';
import Store from './pages/Store';
import VoucherStore from './pages/VoucherStore';
import MyRedemptions from './pages/MyRedemptions';
import ReceiptDetail from './pages/ReceiptDetail';
import EarnHistory from './pages/EarnHistory';
import EarnMap from './pages/EarnMap';
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
    <nav className="nav">
      <NavLink to="/" className="nav-brand">쌓음</NavLink>
      {link({ to: '/app/balance', children: '잔액' })}
      {link({ to: '/app/transactions', children: '내역' })}
      {link({ to: '/app/earn-history', children: '적립 내역' })}
      {link({ to: '/app/earn-map', children: '적립 장소' })}
      {link({ to: '/app/vouchers', children: '상품권' })}
      {link({ to: '/app/my-credits', children: '내 교환' })}
      {link({ to: '/app/spend', children: '결제' })}
      {link({ to: '/app/conversion', children: '정산 옵션' })}
      {link({ to: '/app/store', children: '가게' })}
    </nav>
  );
}

function AppLayout() {
  return (
    <div className="app">
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
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="/app/balance" replace />} />
        <Route path="balance" element={<Balance />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="earn-history" element={<EarnHistory />} />
        <Route path="earn-map" element={<EarnMap />} />
        <Route path="vouchers" element={<VoucherStore />} />
        <Route path="my-credits" element={<MyRedemptions />} />
        <Route path="receipts/:id" element={<ReceiptDetail />} />
        <Route path="spend" element={<Spend />} />
        <Route path="conversion" element={<Conversion />} />
        <Route path="store" element={<Store />} />
      </Route>
    </Routes>
  );
}
