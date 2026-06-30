import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useI18n } from '../i18n/context';
import PageIntro from '../components/PageIntro';

const DEFAULT_USER = 'U1';

function formatAmount(s: string, locale: string): string {
  const n = Number(s);
  if (Number.isNaN(n)) return s;
  return n.toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US');
}

export default function Balance() {
  const { t, locale } = useI18n();
  const [userId, setUserId] = useState(DEFAULT_USER);
  const [balance, setBalance] = useState<{
    balance: string;
    reserved_balance: string;
    available: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBalance = async () => {
    setLoading(true);
    setError(null);
    const { data, error: e } = await api.getBalance(userId);
    setLoading(false);
    if (e) {
      setError(e.message);
      setBalance(null);
      return;
    }
    if (data) setBalance(data);
  };

  useEffect(() => {
    fetchBalance();
  }, [userId]);

  return (
    <>
      <PageIntro title={t('nav.balance')} lead={t('app.helpWhatIsSp')} />

      <div className="card">
        <label className="card-title">{t('app.userId')}</label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          onBlur={() => userId && fetchBalance()}
          placeholder="U1"
          className="input-field"
        />
        <p className="help-tip">{t('app.userIdHint')}</p>
      </div>

      {loading && <p className="loading">{t('app.loading')}</p>}
      {error && <div className="msg-error">{error}</div>}

      {!loading && balance && (
        <div className="card">
          <p className="card-title">{t('app.yourPoints')}</p>
          <p className="balance-value">
            {formatAmount(balance.available, locale)} {t('brand.points')}
          </p>
          <p className="card-title" style={{ marginTop: '1rem' }}>{t('app.reserved')}</p>
          <p className="mono-muted">{formatAmount(balance.reserved_balance, locale)} {t('brand.points')}</p>
          <p className="card-title" style={{ marginTop: '0.5rem' }}>{t('app.total')}</p>
          <p className="mono-muted">{formatAmount(balance.balance, locale)} {t('brand.points')}</p>
        </div>
      )}

      {!loading && !balance && !error && (
        <div className="card">
          <p className="empty">{t('app.noAccount')}</p>
        </div>
      )}
    </>
  );
}
