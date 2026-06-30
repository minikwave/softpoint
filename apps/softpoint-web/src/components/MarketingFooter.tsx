import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/context';

export default function MarketingFooter() {
  const { t } = useI18n();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">{t('brand.name')}</div>
        <p className="site-footer-tagline">{t('brand.tagline')}</p>
        <nav className="site-footer-nav" aria-label="Footer">
          <Link to="/product">{t('nav.product')}</Link>
          <Link to="/integrate">{t('nav.integrate')}</Link>
          <Link to="/onboarding">{t('nav.onboarding')}</Link>
          <Link to="/developers">{t('nav.developers')}</Link>
          <Link to="/app/home">{t('nav.openApp')}</Link>
        </nav>
        <p className="site-footer-copy">© {new Date().getFullYear()} SoftPoint</p>
      </div>
    </footer>
  );
}
