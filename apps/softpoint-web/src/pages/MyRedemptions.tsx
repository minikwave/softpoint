import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type RedemptionItem } from '../api/client';
import { useI18n } from '../i18n/context';
import PageIntro from '../components/PageIntro';
import { Card, CardLabel, Input, EmptyState } from '../design-system/components';
import { formatDate } from '../utils/format';

const DEFAULT_USER = 'U1';

export default function MyRedemptions() {
  const { t, locale } = useI18n();
  const [userId, setUserId] = useState(DEFAULT_USER);
  const [items, setItems] = useState<RedemptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getRedemptions(userId).then(({ data, error: e }) => {
      if (cancelled) return;
      setLoading(false);
      if (e) {
        setError(e.message);
        setItems([]);
        return;
      }
      setItems(data?.items ?? []);
    });
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <>
      <PageIntro title={t('redemptions.title')} lead={t('redemptions.lead')} />

      <Card>
        <CardLabel>{t('forms.userId')}</CardLabel>
        <Input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} style={{ maxWidth: '200px' }} />
      </Card>

      {loading && <p className="loading">{t('forms.loading')}</p>}
      {error && <div className="msg-error">{error}</div>}

      {!loading && !error && items.length === 0 && <EmptyState>{t('redemptions.empty')}</EmptyState>}

      {!loading && items.length > 0 && (
        <Card>
          <ul className="place-list">
            {items.map((r) => (
              <li key={r.id} className="place-item">
                <div className="place-name">{r.product_name}</div>
                <div className="place-meta">
                  {r.status} · {formatDate(r.created_at, locale)}
                </div>
                {r.code_display && (
                  <div className="mono-small" style={{ marginTop: '0.35rem' }}>
                    {t('redemptions.code')}: <strong>{r.code_display}</strong>
                  </div>
                )}
                {r.receipt_id && (
                  <Link to={`/app/receipts/${r.receipt_id}`} className="place-map-link">
                    {t('redemptions.viewReceipt')}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
