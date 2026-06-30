import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/context';

export default function Landing() {
  const { t } = useI18n();

  return (
    <main className="landing-hero">
      <div className="landing-hero-glow" aria-hidden />
      <div className="landing-hero-inner">
        <p className="landing-eyebrow">{t('landing.eyebrow')}</p>
        <h1 className="landing-hero-title">
          {t('landing.heroTitle')}
          <br />
          <span className="landing-gradient">{t('landing.heroTitleAccent')}</span>
        </h1>
        <p className="landing-hero-lead">{t('landing.heroLead')}</p>
        <div className="landing-hero-actions">
          <Link to="/app/home" className="landing-btn landing-btn-primary">
            {t('landing.ctaApp')}
          </Link>
          <Link to="/integrate" className="landing-btn landing-btn-secondary">
            {t('landing.ctaIntegrate')}
          </Link>
        </div>
      </div>

      <section className="landing-section" aria-labelledby="why-softpoint">
        <div className="landing-section-inner">
          <h2 id="why-softpoint" className="landing-section-title">
            {t('landing.sectionRewardsTitle')}
          </h2>
          <p className="landing-section-lead">{t('landing.sectionRewardsLead')}</p>
          <div className="landing-card-grid">
            <article className="landing-card">
              <h3>{t('landing.reward1Title')}</h3>
              <p>{t('landing.reward1Desc')}</p>
            </article>
            <article className="landing-card">
              <h3>{t('landing.reward2Title')}</h3>
              <p>{t('landing.reward2Desc')}</p>
            </article>
            <article className="landing-card">
              <h3>{t('landing.reward3Title')}</h3>
              <p>{t('landing.reward3Desc')}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt" aria-labelledby="earn-use">
        <div className="landing-section-inner landing-two-col">
          <div>
            <h2 id="earn-use" className="landing-section-title">
              {t('landing.sectionEarnTitle')}
            </h2>
            <ul className="landing-checklist">
              <li>{t('landing.earnPayment')}</li>
              <li>{t('landing.earnWalk')}</li>
              <li>{t('landing.earnAd')}</li>
              <li>{t('landing.earnPartner')}</li>
            </ul>
          </div>
          <div>
            <h2 className="landing-section-title">{t('landing.sectionUseTitle')}</h2>
            <ul className="landing-checklist">
              <li>{t('landing.useVoucher')}</li>
              <li>{t('landing.useMarket')}</li>
              <li>{t('landing.useStable')}</li>
              <li>{t('landing.usePay')}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="integrate-steps">
        <div className="landing-section-inner landing-integrate-band">
          <h2 id="integrate-steps" className="landing-section-title">
            {t('landing.sectionIntegrateTitle')}
          </h2>
          <ol className="landing-steps">
            <li>{t('landing.integrateStep1')}</li>
            <li>{t('landing.integrateStep2')}</li>
            <li>{t('landing.integrateStep3')}</li>
          </ol>
          <div className="landing-hero-actions">
            <Link to="/onboarding" className="landing-btn landing-btn-primary">
              {t('nav.onboarding')}
            </Link>
            <Link to="/product" className="landing-btn landing-btn-secondary">
              {t('landing.footnote')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
