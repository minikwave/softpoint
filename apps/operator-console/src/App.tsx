import { Routes, Route, NavLink } from 'react-router-dom';
import Users from './pages/Users';
import Account from './pages/Account';
import Conversions from './pages/Conversions';

export default function App() {
  return (
    <div className="app">
      <nav className="console-nav">
        <span className="brand">Operator Console</span>
        <NavLink to="/" className={({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')} end>
          사용자 검색
        </NavLink>
        <NavLink to="/conversions" className={({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')}>
          전환 (PayPoint → Stable)
        </NavLink>
      </nav>
      <main className="main">
        <Routes>
          <Route path="/" element={<Users />} />
          <Route path="/accounts/:userId" element={<Account />} />
          <Route path="/conversions" element={<Conversions />} />
        </Routes>
      </main>
    </div>
  );
}
