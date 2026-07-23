import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/context';
import PageIntro from '../components/PageIntro';

export default function Integrate() {
  const { t } = useI18n();

  const why = ['why1', 'why2', 'why3'] as const;
  const flow = ['flow1', 'flow2', 'flow3', 'flow4', 'flow5'] as const;

  return (
    <main className="marketing-main">
      <PageIntro title={t('integrate.title')} lead={t('integrate.lead')} />

      <h2 className="marketing-h2">{t('integrate.whyTitle')}</h2>
      <ul className="marketing-list">
        {why.map((k) => (
          <li key={k}>{t(`integrate.${k}`)}</li>
        ))}
      </ul>

      <h2 className="marketing-h2">{t('integrate.flowTitle')}</h2>
      <ol className="marketing-steps">
        {flow.map((k) => (
          <li key={k}>{t(`integrate.${k}`)}</li>
        ))}
      </ol>

      <div className="integrate-diagram card" aria-hidden>
        <div className="integrate-diagram-row">
          <span className="integrate-box">Your product</span>
          <span className="integrate-arrow">→</span>
          <span className="integrate-box accent">SoftPoint API</span>
          <span className="integrate-arrow">→</span>
          <span className="integrate-box">User SP balance</span>
        </div>
        <p className="integrate-diagram-caption">
          Issue · Earn · Spend · Redeem · Receipt
        </p>
        <div className="integrate-diagram-row" style={{ marginTop: '1rem' }}>
          <span className="integrate-box">SoftPay checkout</span>
          <span className="integrate-arrow">→</span>
          <span className="integrate-box accent">SETTLED webhook</span>
          <span className="integrate-arrow">→</span>
          <span className="integrate-box">SoftPoint SP+</span>
        </div>
        <p className="integrate-diagram-caption">
          SoftPay loyalty only — SoftPG agent credit is separate
        </p>
      </div>

      <div className="marketing-actions">
        <Link to="/onboarding" className="landing-btn landing-btn-primary">
          {t('integrate.ctaOnboarding')}
        </Link>
        <Link to="/developers" className="landing-btn landing-btn-secondary">
          {t('integrate.ctaDevelopers')}
        </Link>
      </div>
    </main>
  );
}
