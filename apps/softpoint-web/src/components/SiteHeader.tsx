import { Link, NavLink } from 'react-router-dom';
import { useI18n } from '../i18n/context';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function SiteHeader() {
  const { t } = useI18n();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="site-header-brand">
          {t('brand.name')}
        </Link>
        <nav className="site-header-nav" aria-label={t('brand.name')}>
          <NavLink
            to="/product"
            className={({ isActive }) => `site-header-link${isActive ? ' active' : ''}`}
          >
            {t('nav.product')}
          </NavLink>
          <NavLink
            to="/integrate"
            className={({ isActive }) => `site-header-link${isActive ? ' active' : ''}`}
          >
            {t('nav.integrate')}
          </NavLink>
          <NavLink
            to="/onboarding"
            className={({ isActive }) => `site-header-link${isActive ? ' active' : ''}`}
          >
            {t('nav.onboarding')}
          </NavLink>
          <NavLink
            to="/developers"
            className={({ isActive }) => `site-header-link${isActive ? ' active' : ''}`}
          >
            {t('nav.developers')}
          </NavLink>
          <LanguageSwitcher />
          <Link to="/app/home" className="site-header-cta">
            {t('nav.openApp')}
          </Link>
        </nav>
      </div>
    </header>
  );
}
