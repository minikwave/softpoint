import { Routes, Route, NavLink } from 'react-router-dom';
import Users from './pages/Users';
import Account from './pages/Account';
import Conversions from './pages/Conversions';
import Policies from './pages/Policies';
import Exceptions from './pages/Exceptions';
import AuditLogs from './pages/AuditLogs';
import Dashboard from './pages/Dashboard';
import Receipts from './pages/Receipts';
import Reserve from './pages/Reserve';

export default function App() {
  return (
    <div className="app">
      <nav className="console-nav">
        <span className="brand">Operator Console</span>
        <NavLink to="/dashboard" className={({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')}>
          대시보드
        </NavLink>
        <NavLink to="/" className={({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')} end>
          사용자
        </NavLink>
        <NavLink to="/policies" className={({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')}>
          정책
        </NavLink>
        <NavLink to="/exceptions" className={({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')}>
          예외
        </NavLink>
        <NavLink to="/conversions" className={({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')}>
          전환
        </NavLink>
        <NavLink to="/receipts" className={({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')}>
          영수증
        </NavLink>
        <NavLink to="/reserve" className={({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')}>
          준비금
        </NavLink>
        <NavLink to="/audit-logs" className={({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')}>
          감사 로그
        </NavLink>
      </nav>
      <main className="main">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<Users />} />
          <Route path="/receipts" element={<Receipts />} />
          <Route path="/reserve" element={<Reserve />} />
          <Route path="/accounts/:userId" element={<Account />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/exceptions" element={<Exceptions />} />
          <Route path="/conversions" element={<Conversions />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
        </Routes>
      </main>
    </div>
  );
}
