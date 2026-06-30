import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type TransactionItem } from '../api/client';
import { useI18n } from '../i18n/context';
import PageIntro from '../components/PageIntro';
import { Card, EmptyState } from '../design-system/components';
import { formatAmount, formatDate } from '../utils/format';

import { useUserId } from '../hooks/useUserId';
import UserIdField from '../components/UserIdField';

function typeBadge(type: string): string {
  const t = type.toLowerCase();
  if (t === 'issue') return 'badge-issue';
  if (t === 'spend') return 'badge-spend';
  if (t === 'expire') return 'badge-expire';
  if (t === 'adjust') return 'badge-adjust';
  return '';
}

export default function Transactions() {
  const { t, locale } = useI18n();
  const { userId, setUserId } = useUserId();
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.getTransactions(userId)
      .then(({ data, error: e }) => {
        if (cancelled) return;
        setLoading(false);
        if (e) {
          setError(e.message);
          setItems([]);
          return;
        }
        if (data) setItems(data.items);
      });
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <>
      <PageIntro title={t('transactions.title')} lead={t('transactions.lead')} />

      <Card>
        <UserIdField value={userId} onChange={setUserId} />
      </Card>

      {loading && <p className="loading">{t('forms.querying')}</p>}
      {error && <div className="msg-error">{error}</div>}

      {!loading && !error && (
        <Card>
          {items.length === 0 ? (
            <EmptyState>{t('transactions.empty')}</EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('transactions.colType')}</th>
                    <th>{t('transactions.colAmount')}</th>
                    <th>{t('transactions.colOrder')}</th>
                    <th>{t('transactions.colReceipt')}</th>
                    <th>{t('transactions.colDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.tx_id}>
                      <td>
                        <span className={`badge ${typeBadge(row.type)}`}>{row.type}</span>
                      </td>
                      <td>{formatAmount(row.amount, locale)} {t('brand.points')}</td>
                      <td>{row.order_id ?? t('forms.noData')}</td>
                      <td>
                        {row.receipt_id ? (
                          <Link to={`/app/receipts/${row.receipt_id}`} className="place-map-link">
                            {row.receipt_id.slice(0, 8)}…
                          </Link>
                        ) : (
                          t('forms.noData')
                        )}
                      </td>
                      <td>{formatDate(row.created_at, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </>
  );
}
