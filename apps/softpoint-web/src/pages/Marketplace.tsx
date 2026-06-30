import { useI18n } from '../i18n/context';
import PageIntro from '../components/PageIntro';
import { Card, Button, EmptyState } from '../design-system/components';

const DEMO_LISTINGS = [
  { id: 'L1', title: '5,000 SP bundle', price: 4800, seller: 'user_demo_1' },
  { id: 'L2', title: '10,000 SP bundle', price: 9500, seller: 'user_demo_2' },
  { id: 'L3', title: 'Walk mission boost', price: 1200, seller: 'partner_walk' },
];

export default function Marketplace() {
  const { t, locale } = useI18n();

  const formatPrice = (n: number) =>
    n.toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US');

  return (
    <>
      <PageIntro title={t('marketplace.title')} lead={t('marketplace.lead')} />

      <Card elevated>
        <p className="sp-field-hint" style={{ margin: 0 }}>{t('marketplace.sellHint')}</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="secondary" disabled title={t('marketplace.comingSoon')}>
            {t('marketplace.sell')}
          </Button>
        </div>
      </Card>

      <div className="market-grid">
        {DEMO_LISTINGS.map((item) => (
          <Card key={item.id} className="market-card">
            <span className="market-demo-tag">{t('marketplace.demoBadge')}</span>
            <div className="voucher-name">{item.title}</div>
            <div className="place-meta">
              {t('marketplace.seller')}: {item.seller}
            </div>
            <div className="voucher-price">
              {t('marketplace.price')}: {formatPrice(item.price)} {t('brand.points')}
            </div>
            <Button variant="primary" disabled title={t('marketplace.comingSoon')}>
              {t('marketplace.buy')}
            </Button>
          </Card>
        ))}
      </div>

      {DEMO_LISTINGS.length === 0 && <EmptyState>{t('marketplace.empty')}</EmptyState>}
    </>
  );
}
