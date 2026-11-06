import type { Lang } from '@/types';

/** Localised string map used only inside mock content. */
export interface L {
  en: string;
  hi?: string;
  kn?: string;
}

/**
 * Picks strings for one language and remembers whether anything had to fall back to English,
 * so responses can honestly report `contentLang`.
 */
export function translator(lang: Lang) {
  let fellBack = false;
  const t = (value: L): string => {
    if (lang === 'en') return value.en;
    const hit = (value as Partial<Record<Lang, string>>)[lang];
    if (hit) return hit;
    fellBack = true;
    return value.en;
  };
  return {
    t,
    list: (values: L[]): string[] => values.map(t),
    served: (): Lang => (fellBack ? 'en' : lang),
  };
}

/** Shorthand for a string that is identical in all languages (product names, numbers). */
export const same = (text: string): L => ({ en: text, hi: text, kn: text });
