import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/context';
import PageIntro from '../components/PageIntro';
import { repoBlob, repoRoot } from '../config/repo';

const API_PREFIX = import.meta.env.VITE_API_URL?.trim() || '(set VITE_API_URL)';

export default function Developers() {
  const { t } = useI18n();

  const endpoints = [
    'GET /v1/paypoint/balance/:user_id',
    'POST /v1/paypoint/issue',
    'POST /v1/paypoint/earn/payment',
    'POST /v1/paypoint/earn/activity',
    'GET /v1/paypoint/earn-activities',
    'GET /v1/paypoint/credits/products',
    'POST /v1/paypoint/credits/redeem',
    'GET /v1/paypoint/receipts',
    'GET /v1/admin/dashboard',
  ];

  return (
    <main className="marketing-main">
      <PageIntro title={t('developers.title')} lead={t('developers.lead')} />

      <p className="marketing-p">
        <a href={repoRoot()} target="_blank" rel="noreferrer">{repoRoot()}</a>
      </p>

      <h2 className="marketing-h2">{t('developers.baseUrl')}</h2>
      <p className="marketing-p">
        <code className="inline-code">{API_PREFIX}</code>
      </p>

      <h2 className="marketing-h2">{t('developers.endpoints')}</h2>
      <ul className="marketing-list">
        {endpoints.map((ep) => (
          <li key={ep}>
            <code className="inline-code">{ep}</code>
          </li>
        ))}
      </ul>

      <h2 className="marketing-h2">{t('developers.auth')}</h2>
      <p className="marketing-p">{t('developers.authDetail')}</p>

      <h2 className="marketing-h2">{t('developers.docsList')}</h2>
      <ul className="marketing-list">
        <li>
          <a href={repoBlob('docs/INTEGRATION_ONBOARDING.md')} target="_blank" rel="noreferrer">
            Integration & onboarding
          </a>
        </li>
        <li>
          <a href={repoBlob('docs/SOFTPOINT_PRODUCT_VISION.md')} target="_blank" rel="noreferrer">
            Product vision
          </a>
        </li>
        <li>
          <a href={repoBlob('docs/DEPLOY.md')} target="_blank" rel="noreferrer">
            Deploy
          </a>
        </li>
      </ul>

      <div className="marketing-actions">
        <Link to="/integrate" className="landing-btn landing-btn-primary">
          {t('nav.integrate')}
        </Link>
      </div>
    </main>
  );
}
