import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/context';
import PageIntro from '../components/PageIntro';

export default function Onboarding() {
  const { t } = useI18n();

  const checks = ['check1', 'check2', 'check3', 'check4', 'check5'] as const;
  const dev = ['dev1', 'dev2', 'dev3', 'dev4'] as const;

  return (
    <main className="marketing-main">
      <PageIntro title={t('onboarding.title')} lead={t('onboarding.lead')} />

      <h2 className="marketing-h2">{t('onboarding.checklistTitle')}</h2>
      <ul className="onboarding-checklist">
        {checks.map((k, i) => (
          <li key={k}>
            <span className="onboarding-step-num">{i + 1}</span>
            <span>{t(`onboarding.${k}`)}</span>
          </li>
        ))}
      </ul>

      <h2 className="marketing-h2">{t('onboarding.devTitle')}</h2>
      <ul className="marketing-list">
        {dev.map((k) => (
          <li key={k}>
            <code className="inline-code">{t(`onboarding.${k}`)}</code>
          </li>
        ))}
      </ul>

      <div className="marketing-actions">
        <Link to="/app/home" className="landing-btn landing-btn-primary">
          {t('onboarding.tryApp')}
        </Link>
        <Link to="/developers" className="landing-btn landing-btn-secondary">
          {t('nav.developers')}
        </Link>
      </div>
    </main>
  );
}
