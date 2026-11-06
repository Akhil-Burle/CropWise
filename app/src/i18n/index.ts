import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import { usePrefs } from '@/store/prefsStore';
import type { Lang } from '@/types';

/** Each language is written in its own script so readers can find theirs without knowing English. */
const ALL_LANGUAGES: readonly { code: Lang; label: string; english: string; short: string }[] = [
  { code: 'en', label: 'English', english: 'English', short: 'EN' },
  { code: 'hi', label: 'हिन्दी', english: 'Hindi', short: 'हि' },
  { code: 'kn', label: 'ಕನ್ನಡ', english: 'Kannada', short: 'ಕ' },
  { code: 'ta', label: 'தமிழ்', english: 'Tamil', short: 'த' },
  { code: 'te', label: 'తెలుగు', english: 'Telugu', short: 'తె' },
  { code: 'mr', label: 'मराठी', english: 'Marathi', short: 'म' },
  { code: 'bn', label: 'বাংলা', english: 'Bengali', short: 'বা' },
  { code: 'gu', label: 'ગુજરાતી', english: 'Gujarati', short: 'ગુ' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', english: 'Punjabi', short: 'ਪੰ' },
  { code: 'ml', label: 'മലയാളം', english: 'Malayalam', short: 'മ' },
  { code: 'or', label: 'ଓଡ଼ିଆ', english: 'Odia', short: 'ଓ' },
];

/**
 * Non-English files are loaded on demand, so adding languages does not grow the first download.
 * Files are produced by tools/i18n/translate.mjs; a missing file or key falls back to English.
 */
const loaders = import.meta.glob<{ default: Record<string, unknown> }>(['./locales/*.json', '!./locales/en.json']);

export function hasLocaleFile(lang: Lang): boolean {
  return lang === 'en' || `./locales/${lang}.json` in loaders;
}

/** Only languages with a translation file are offered. Run tools/i18n to add more. */
export const LANGUAGE_OPTIONS = ALL_LANGUAGES.filter((l) => hasLocaleFile(l.code));

async function ensureLoaded(lang: Lang): Promise<void> {
  if (lang === 'en' || i18n.hasResourceBundle(lang, 'translation')) return;
  const load = loaders[`./locales/${lang}.json`];
  if (!load) return;
  const mod = await load();
  i18n.addResourceBundle(lang, 'translation', mod.default, true, true);
}

export async function setLanguage(lang: Lang): Promise<void> {
  await ensureLoaded(lang);
  await i18n.changeLanguage(lang);
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

// A saved language whose file was removed falls back to English.
if (!hasLocaleFile(usePrefs.getState().lang)) usePrefs.getState().setLang('en');
void setLanguage(usePrefs.getState().lang);
usePrefs.subscribe((state, prev) => {
  if (state.lang !== prev.lang) void setLanguage(state.lang);
});

export default i18n;
