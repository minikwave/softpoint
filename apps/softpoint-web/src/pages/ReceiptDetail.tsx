import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type ReceiptEventItem, type ReceiptRecord } from '../api/client';
import { useI18n } from '../i18n/context';
import { Card, CardLabel, EmptyState } from '../design-system/components';
import { formatAmount, formatDate } from '../utils/format';

export default function ReceiptDetail() {
  const { t, locale } = useI18n();
  const { id } = useParams<{ id: string }>();
  const [receipt, setReceipt] = useState<ReceiptRecord | null>(null);
  const [events, setEvents] = useState<ReceiptEventItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([api.getReceipt(id), api.getReceiptEvents(id)]).then(([r, ev]) => {
      if (cancelled) return;
      setLoading(false);
      if (r.error) {
        setError(r.error.message);
        return;
      }
      setReceipt(r.data ?? null);
      setEvents(ev.data?.items ?? []);
    });
    return () => { cancelled = true; };
  }, [id]);

  if (!id) return <div className="msg-error">{t('receipt.noId')}</div>;

  return (
    <>
      <p style={{ marginBottom: '0.5rem' }}>
        <Link to="/app/transactions">{t('receipt.backToHistory')}</Link>
      </p>
      <h1 className="page-title">{t('receipt.title')}</h1>

      {loading && <p className="loading">{t('forms.loading')}</p>}
      {error && <div className="msg-error">{error}</div>}

      {receipt && (
        <>
          <Card>
            <CardLabel>{t('receipt.summary')}</CardLabel>
            <dl className="detail-dl">
              <dt>{t('receipt.id')}</dt>
              <dd className="mono-small">{receipt.id}</dd>
              <dt>{t('receipt.type')}</dt>
              <dd><span className="badge">{receipt.intentType}</span></dd>
              <dt>{t('receipt.status')}</dt>
              <dd><span className="badge">{receipt.status}</span></dd>
              <dt>{t('receipt.amount')}</dt>
              <dd>{formatAmount(receipt.amount, locale)} {t('brand.points')}</dd>
              <dt>{t('receipt.user')}</dt>
              <dd>{receipt.userId}</dd>
              <dt>{t('receipt.created')}</dt>
              <dd>{formatDate(receipt.createdAt, locale)}</dd>
            </dl>
          </Card>

          <Card>
            <CardLabel>{t('receipt.timeline')}</CardLabel>
            {events.length === 0 ? (
              <EmptyState>{t('receipt.noEvents')}</EmptyState>
            ) : (
              <ul className="place-list">
                {events.map((e) => (
                  <li key={e.id} className="place-item">
                    <div className="place-name">{e.type}</div>
                    <div className="place-meta">{formatDate(e.createdAt, locale)}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </>
  );
}
