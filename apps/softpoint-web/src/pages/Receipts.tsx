import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { ReceiptRecord } from '../api/client';
import { useI18n } from '../i18n/context';
import PageIntro from '../components/PageIntro';
import UserIdField from '../components/UserIdField';
import { Card, EmptyState, Badge } from '../design-system/components';
import { useUserId } from '../hooks/useUserId';
import { formatAmount, formatDate } from '../utils/format';

export default function Receipts() {
  const { t, locale } = useI18n();
  const { userId, setUserId } = useUserId();
  const [items, setItems] = useState<ReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.listReceipts(userId).then(({ data, error: e }) => {
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
      <PageIntro title={t('receipts.title')} lead={t('receipts.lead')} />

      <Card>
        <UserIdField value={userId} onChange={setUserId} />
      </Card>

      {loading && <p className="loading">{t('forms.querying')}</p>}
      {error && <div className="msg-error">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <EmptyState>{t('receipts.empty')}</EmptyState>
      )}

      {!loading && items.length > 0 && (
        <ul className="place-list">
          {items.map((r) => (
            <li key={r.id} className="place-item card" style={{ marginBottom: '0.75rem' }}>
              <div className="place-name">
                <Badge variant="default">{r.intentType}</Badge>{' '}
                {formatAmount(r.amount, locale)} {t('brand.points')}
              </div>
              <div className="place-meta">
                {r.status} · {formatDate(r.createdAt, locale)}
              </div>
              <Link to={`/app/receipts/${r.id}`} className="place-map-link">
                {t('receipts.viewDetail')}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
