import type { Lang, Quantity } from '@/types';

const LOCALE: Record<Lang, string> = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN', ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN', bn: 'bn-IN', gu: 'gu-IN', ml: 'ml-IN', pa: 'pa-IN', or: 'or-IN' };

export const locale = (lang: Lang): string => LOCALE[lang];

export function formatNumber(value: number, lang: Lang, maxFractionDigits = 2): string {
  return new Intl.NumberFormat(LOCALE[lang], { maximumFractionDigits: maxFractionDigits }).format(value);
}

export function formatCurrency(amount: number, currency: string, lang: Lang): string {
  return new Intl.NumberFormat(LOCALE[lang], { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatCompactCurrency(amount: number, currency: string, lang: Lang): string {
  return new Intl.NumberFormat(LOCALE[lang], {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatQuantity(q: Quantity | null | undefined, lang: Lang): string {
  if (!q) return '—';
  return `${formatNumber(q.value, lang)} ${q.unit}`.trim();
}

function toDate(iso: string): Date {
  // Treat bare dates as local calendar days.
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
}

export function formatDate(iso: string | null | undefined, lang: Lang, opts: Intl.DateTimeFormatOptions = {}): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(LOCALE[lang], { day: 'numeric', month: 'short', year: 'numeric', ...opts }).format(toDate(iso));
}

export function formatDateTime(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALE[lang], { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(
    toDate(iso),
  );
}

export function formatWeekday(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALE[lang], { weekday: 'short' }).format(toDate(iso));
}

export function formatPercent(fraction: number, lang: Lang): string {
  return new Intl.NumberFormat(LOCALE[lang], { style: 'percent', maximumFractionDigits: 0 }).format(fraction);
}

/** Calendar-day key (yyyy-mm-dd) in local time – used for grouping and calendar cells only. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const initials = (name: string): string =>
  name
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
