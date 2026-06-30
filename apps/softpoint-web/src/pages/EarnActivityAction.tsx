import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useI18n } from '../i18n/context';
import PageIntro from '../components/PageIntro';

const DEFAULT_USER = 'U1';

export default function EarnActivityAction() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEarn = async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    const { data, error: e } = await api.earnActivity({
      user_id: DEFAULT_USER,
      activity_slug: slug,
      idempotency_key: `demo-${slug}-${Date.now()}`,
      proof: { demo: true },
    });
    setLoading(false);
    if (e) {
      setError(e.message);
      return;
    }
    if (data) {
      setMessage(`${data.amount} ${t('brand.points')}`);
    }
  };

  return (
    <>
      <PageIntro title={slug ?? ''} lead={t('earnHub.lead')} />
      <div className="card">
        <p className="help-tip">{t('app.userIdHint')}</p>
        <button type="button" className="btn btn-primary" disabled={loading} onClick={handleEarn}>
          {loading ? t('app.loading') : t('earnHub.start')}
        </button>
        {message && <div className="msg-success">{message}</div>}
        {error && <div className="msg-error">{error}</div>}
      </div>
      <p>
        <Link to="/app/earn">{t('common.back')}</Link>
      </p>
    </>
  );
}
