import { Link, NavLink, Outlet } from 'react-router-dom';
import { useI18n } from '../i18n/context';
import LanguageSwitcher from '../components/LanguageSwitcher';

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

export default function DAppLayout() {
  const { t } = useI18n();

  return (
    <div className="dapp-shell">
      <header className="dapp-header">
        <div className="dapp-header-inner">
          <Link to="/" className="dapp-brand" title={t('brand.name')}>
            {t('brand.name')}
          </Link>
          <span className="dapp-badge">{t('brand.dapp')}</span>
          <nav className="dapp-nav" aria-label={t('brand.dapp')}>
            {navLink('/app/home', t('nav.home'))}
            {navLink('/app/earn', t('nav.earn'))}
            {navLink('/app/vouchers', t('nav.shop'))}
            {navLink('/app/spend', t('nav.pay'))}
            {navLink('/app/more', t('nav.more'))}
          </nav>
          <LanguageSwitcher className="dapp-lang" />
        </div>
      </header>
      <main className="dapp-main">
        <Outlet />
      </main>
    </div>
  );
}
