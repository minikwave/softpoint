import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/context';
import PageIntro from '../components/PageIntro';

export default function AppMore() {
  const { t } = useI18n();

  const links = [
    { to: '/app/balance', label: t('nav.balance') },
    { to: '/app/transactions', label: t('nav.history') },
    { to: '/app/earn-history', label: t('nav.earnHistory') },
    { to: '/app/earn-map', label: t('nav.places') },
    { to: '/app/my-credits', label: t('nav.redemptions') },
    { to: '/app/conversion', label: t('nav.stable') },
    { to: '/app/store', label: t('nav.store') },
    { to: '/onboarding', label: t('nav.onboarding') },
    { to: '/developers', label: t('nav.developers') },
  ];

  return (
    <>
      <PageIntro title={t('more.title')} lead={t('more.lead')} />
      <nav className="more-menu" aria-label={t('more.title')}>
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="more-menu-item">
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
