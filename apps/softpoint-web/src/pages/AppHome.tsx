import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useI18n } from '../i18n/context';
import PageIntro from '../components/PageIntro';
import UserIdField from '../components/UserIdField';
import { Card } from '../design-system/components';
import { useUserId } from '../hooks/useUserId';
import { formatAmount } from '../utils/format';

export default function AppHome() {
  const { t, locale } = useI18n();
  const { userId, setUserId } = useUserId();
  const [available, setAvailable] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    api.health().then(({ data }) => setApiOk(data?.status === 'ok'));
  }, []);

  useEffect(() => {
    setLoading(true);
    api.getBalance(userId).then(({ data, error }) => {
      setLoading(false);
      if (data) setAvailable(data.available);
      else if (error) setAvailable(null);
    });
  }, [userId]);

  const quickLinks = [
    { to: '/app/earn', label: t('app.quickEarn'), icon: '✦' },
    { to: '/app/vouchers', label: t('app.quickShop'), icon: '◇' },
    { to: '/app/market', label: t('nav.market'), icon: '◈' },
    { to: '/app/spend', label: t('app.quickPay'), icon: '→' },
    { to: '/app/conversion', label: t('app.quickStable'), icon: '◎' },
  ];

  return (
    <>
      <PageIntro title={t('app.welcome')} lead={t('app.welcomeSub')} />

      {apiOk === false && (
        <div className="msg-error" style={{ marginBottom: '1rem' }}>
          {t('app.apiOffline')}
        </div>
      )}

      <Card className="home-balance-card">
        <UserIdField value={userId} onChange={setUserId} />
        <p className="card-title" style={{ marginTop: '1rem' }}>{t('app.yourPoints')}</p>
        {loading ? (
          <p className="loading">{t('app.loading')}</p>
        ) : (
          <p className="balance-value">
            {available != null ? `${formatAmount(available, locale)} ${t('brand.points')}` : '—'}
          </p>
        )}
        <p className="help-tip">{t('app.helpWhatIsSp')}</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/app/balance" className="text-link">{t('nav.balance')} →</Link>
          <Link to="/app/receipts" className="text-link">{t('nav.receipts')} →</Link>
        </div>
      </Card>

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
