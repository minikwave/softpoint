import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/context';
import PageIntro from '../components/PageIntro';
import { repoBlob } from '../config/repo';

export default function Product() {
  const { t } = useI18n();

  return (
    <main className="marketing-main">
      <PageIntro title={t('product.title')} lead={t('product.lead')} />

      <h2 className="marketing-h2">{t('product.layersTitle')}</h2>
      <ul className="marketing-list">
        <li>{t('product.layerEngine')}</li>
        <li>{t('product.layerApp')}</li>
        <li>{t('product.layerConsole')}</li>
        <li>{t('product.layerDomain')}</li>
      </ul>

      <h2 className="marketing-h2">{t('product.visionTitle')}</h2>
      <ul className="marketing-list marketing-list-muted">
        <li>{t('product.visionStable')}</li>
        <li>{t('product.visionMarket')}</li>
        <li>{t('product.visionEarn')}</li>
        <li>{t('product.visionEmbed')}</li>
      </ul>

      <div className="marketing-actions">
        <Link to="/integrate" className="landing-btn landing-btn-primary">
          {t('nav.integrate')}
        </Link>
        <a href={repoBlob('docs/SOFTPOINT_PRODUCT_VISION.md')} className="landing-btn landing-btn-secondary" target="_blank" rel="noreferrer">
          {t('common.learnMore')}
        </a>
      </div>
    </main>
  );
}
