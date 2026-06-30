import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useI18n } from '../i18n/context';
import PageIntro from '../components/PageIntro';

const DEFAULT_USER = 'U1';

function formatAmount(s: string, locale: string): string {
  const n = Number(s);
  if (Number.isNaN(n)) return s;
  return n.toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US');
}

export default function AppHome() {
  const { t, locale } = useI18n();
  const [userId] = useState(DEFAULT_USER);
  const [available, setAvailable] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBalance(userId).then(({ data, error }) => {
      setLoading(false);
      if (data) setAvailable(data.available);
      else if (error) setAvailable(null);
    });
  }, [userId]);

  const quickLinks = [
    { to: '/app/earn', label: t('app.quickEarn'), icon: '✦' },
    { to: '/app/vouchers', label: t('app.quickShop'), icon: '◇' },
    { to: '/app/spend', label: t('app.quickPay'), icon: '→' },
    { to: '/app/conversion', label: t('app.quickStable'), icon: '◎' },
  ];

  return (
    <>
      <PageIntro title={t('app.welcome')} lead={t('app.welcomeSub')} />

      <div className="card home-balance-card">
        <p className="card-title">{t('app.yourPoints')}</p>
        {loading ? (
          <p className="loading">{t('app.loading')}</p>
        ) : (
          <p className="balance-value">
            {available != null ? `${formatAmount(available, locale)} ${t('brand.points')}` : '—'}
          </p>
        )}
        <p className="help-tip">{t('app.helpWhatIsSp')}</p>
        <Link to="/app/balance" className="text-link">
          {t('nav.balance')} →
        </Link>
      </div>

      <div className="quick-grid">
        {quickLinks.map((item) => (
          <Link key={item.to} to={item.to} className="quick-card">
            <span className="quick-icon" aria-hidden>{item.icon}</span>
            <span className="quick-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
