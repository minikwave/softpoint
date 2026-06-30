import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type EarnActivityItem } from '../api/client';
import { useI18n } from '../i18n/context';
import PageIntro from '../components/PageIntro';

export default function EarnHub() {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<EarnActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getEarnActivities().then(({ data, error: e }) => {
      setLoading(false);
      if (e) {
        setError(e.message);
        return;
      }
      setItems(data?.items ?? []);
    });
  }, []);

  const nameFor = (item: EarnActivityItem) =>
    locale === 'ko' ? item.name_ko : item.name_en;

  const descFor = (item: EarnActivityItem) =>
    locale === 'ko' ? item.description_ko : item.description_en;

  return (
    <>
      <PageIntro title={t('earnHub.title')} lead={t('earnHub.lead')} />

      {loading && <p className="loading">{t('app.loading')}</p>}
      {error && <div className="msg-error">{error}</div>}

      <div className="earn-activity-grid">
        {items.map((item) => (
          <article key={item.id} className="card earn-activity-card">
            <span className={`earn-activity-type type-${item.activity_type.toLowerCase()}`}>
              {item.activity_type}
            </span>
            <h3 className="earn-activity-name">{nameFor(item)}</h3>
            {descFor(item) && <p className="earn-activity-desc">{descFor(item)}</p>}
            {item.reward_label && (
              <p className="earn-activity-reward">
                {t('earnHub.reward')}: {item.reward_label}
              </p>
            )}
            {item.status === 'COMING_SOON' ? (
              <span className="demo-pill">{t('earnHub.comingSoon')}</span>
            ) : (
              <Link
                to={
                  item.activity_type === 'PAYMENT'
                    ? '/app/spend'
                    : item.activity_type === 'PARTNER_STORE'
                      ? '/app/earn-map'
                      : `/app/earn/${item.slug}`
                }
                className="btn btn-primary earn-activity-cta"
              >
                {t('earnHub.start')}
              </Link>
            )}
          </article>
        ))}
      </div>

      <p className="help-tip">
        <Link to="/app/earn-history">{t('nav.earnHistory')}</Link>
        {' · '}
        <Link to="/integrate">{t('nav.integrate')}</Link>
      </p>
    </>
  );
}
