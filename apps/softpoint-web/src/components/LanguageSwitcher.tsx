import { useI18n } from '../i18n/context';
import type { Locale } from '../i18n/types';

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  const options: Locale[] = ['ko', 'en'];

  return (
    <div className={`lang-switcher ${className}`.trim()} role="group" aria-label="Language">
      {options.map((l) => (
        <button
          key={l}
          type="button"
          className={`lang-switcher-btn${locale === l ? ' active' : ''}`}
          onClick={() => setLocale(l)}
        >
          {t(`lang.${l}`)}
        </button>
      ))}
    </div>
  );
}
