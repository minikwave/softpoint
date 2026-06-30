import type { Locale } from '../i18n/types';

export function formatAmount(value: string | number, locale: Locale): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US');
}

export function formatDate(iso: string, locale: Locale): string {
  try {
    return new Date(iso).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}
