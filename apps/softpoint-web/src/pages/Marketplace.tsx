import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/context';
import PageIntro from '../components/PageIntro';
import { Card, Button, EmptyState } from '../design-system/components';
import { api, type MarketListingItem } from '../api/client';
import { formatAmount } from '../utils/format';

export default function Marketplace() {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<MarketListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getMarketListings().then(({ data, error: e }) => {
      setLoading(false);
      if (e) {
        setError(e.message);
        return;
      }
      setItems(data?.items ?? []);
    });
  }, []);

  return (
    <>
      <PageIntro title={t('marketplace.title')} lead={t('marketplace.lead')} />

      <Card elevated>
        <p className="sp-field-hint" style={{ margin: 0 }}>{t('marketplace.sellHint')}</p>
        <div style={{ marginTop: '1rem' }}>
          <Button variant="secondary" disabled title={t('marketplace.comingSoon')}>
            {t('marketplace.sell')}
          </Button>
        </div>
      </Card>

      {loading && <p className="loading">{t('forms.loading')}</p>}
      {error && <div className="msg-error">{error}</div>}

      {!loading && !error && (
        <div className="market-grid">
          {items.map((item) => (
            <Card key={item.id} className="market-card">
              <span className="market-demo-tag">{t('marketplace.demoBadge')}</span>
              <div className="voucher-name">{item.title}</div>
              {item.description && <div className="voucher-desc">{item.description}</div>}
              <div className="place-meta">
                {t('marketplace.seller')}: {item.seller_id}
              </div>
              <div className="voucher-price">
                {t('marketplace.price')}: {formatAmount(item.price_sp, locale)} {t('brand.points')}
              </div>
              <Button variant="primary" disabled title={t('marketplace.comingSoon')}>
                {t('marketplace.buy')}
              </Button>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyState>{t('marketplace.empty')}</EmptyState>
      )}
    </>
  );
}
