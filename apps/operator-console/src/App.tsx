import { Routes, Route, NavLink } from 'react-router-dom';
import Users from './pages/Users';
import Account from './pages/Account';
import Conversions from './pages/Conversions';
import AuditLogs from './pages/AuditLogs';
import Policies from './pages/Policies';

export default function App() {
  return (
    <div className="app">
      <nav className="console-nav">
        <span className="brand">Operator Console</span>
        <NavLink to="/" className={({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')} end>
          사용자 검색
        </NavLink>
        <NavLink to="/policies" className={({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')}>
          정책
        </NavLink>
        <NavLink to="/conversions" className={({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')}>
          전환 (PayPoint → Stable)
        </NavLink>
        <NavLink to="/audit-logs" className={({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')}>
          감사 로그
        </NavLink>
      </nav>
      <main className="main">
        <Routes>
          <Route path="/" element={<Users />} />
          <Route path="/accounts/:userId" element={<Account />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/conversions" element={<Conversions />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
        </Routes>
      </main>
    </div>
  );
}
