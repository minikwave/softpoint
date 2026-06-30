import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Locale, TranslationDict } from './types';
import ko from './locales/ko';
import en from './locales/en';

const STORAGE_KEY = 'softpoint_locale';

const dictionaries: Record<Locale, TranslationDict> = { ko, en };

function readInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'ko';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'ko') return stored;
  return navigator.language.startsWith('ko') ? 'ko' : 'en';
}

function resolve(dict: TranslationDict, key: string): string | undefined {
  const parts = key.split('.');
  let cur: string | TranslationDict | undefined = dict;
  for (const part of parts) {
    if (cur == null || typeof cur === 'string') return undefined;
    cur = cur[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let value = resolve(dictionaries[locale], key) ?? resolve(dictionaries.en, key);
      if (value == null) return key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          value = value.replaceAll(`{${k}}`, String(v));
        }
      }
      return value;
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within LocaleProvider');
  return ctx;
}
