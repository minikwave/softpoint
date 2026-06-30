import { useState, useEffect } from 'react';
import { api, type TransactionItem } from '../api/client';
import { useI18n } from '../i18n/context';
import PageIntro from '../components/PageIntro';
import { Card, CardLabel, Input, EmptyState } from '../design-system/components';
import { formatAmount, formatDate } from '../utils/format';

const DEFAULT_USER = 'U1';

export default function EarnHistory() {
  const { t, locale } = useI18n();
  const [userId, setUserId] = useState(DEFAULT_USER);
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.getTransactions(userId, 50, undefined, 'ISSUE')
      .then(({ data, error: e }) => {
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
      <PageIntro title={t('earnHistory.title')} lead={t('earnHistory.lead')} />

      <Card>
        <CardLabel>{t('forms.userId')}</CardLabel>
        <Input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder={t('forms.userIdPlaceholder')}
          style={{ maxWidth: '200px' }}
        />
      </Card>

      {loading && <p className="loading">{t('forms.querying')}</p>}
      {error && <div className="msg-error">{error}</div>}

      {!loading && !error && (
        <Card>
          {items.length === 0 ? (
            <EmptyState>{t('earnHistory.empty')}</EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('earnHistory.colAmount')}</th>
                    <th>{t('transactions.colOrder')}</th>
                    <th>{t('earnHistory.colDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.tx_id}>
                      <td className="earn-amount">+{formatAmount(row.amount, locale)} {t('brand.points')}</td>
                      <td>{row.order_id ?? t('forms.noData')}</td>
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
