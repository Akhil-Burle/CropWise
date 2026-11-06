import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AreaUnit, Lang } from '@/types';
import { LANGS } from '@/types';

export type ThemePref = 'light' | 'dark' | 'system';
export type TextSize = 'sm' | 'md' | 'lg' | 'xl';
export const TEXT_SIZES: TextSize[] = ['sm', 'md', 'lg', 'xl'];

interface PrefsState {
  lang: Lang;
  theme: ThemePref;
  textSize: TextSize;
  areaUnit: AreaUnit;
  demoBannerDismissed: boolean;
  tourDone: boolean;
  /** First-launch language picker has been answered. */
  langChosen: boolean;
  /** Remembered so a farmer does not re-enter farm, crop and stage every time. */
  lastCheck: { farmId: string; cropId: string; growthStage: 'vegetative' | 'flowering' | 'fruiting' } | null;
  activeFarmId: string | null;
  /** null = decide from role (farmers get the simple view, experts the full one). */
  simpleMode: boolean | null;
  setSimpleMode: (v: boolean | null) => void;
  setLang: (lang: Lang) => void;
  setTheme: (theme: ThemePref) => void;
  setTextSize: (size: TextSize) => void;
  stepTextSize: (delta: 1 | -1) => void;
  setAreaUnit: (unit: AreaUnit) => void;
  dismissDemoBanner: () => void;
  setTourDone: (done: boolean) => void;
  chooseLang: (lang: Lang) => void;
  setLastCheck: (v: PrefsState['lastCheck']) => void;
  setActiveFarmId: (id: string | null) => void;
}

function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'en';
  const code = navigator.language.toLowerCase().slice(0, 2);
  return (LANGS as readonly string[]).includes(code) ? (code as Lang) : 'en';
}

/** UI preferences only (no domain data). Persisted locally. */
export const usePrefs = create<PrefsState>()(
  persist(
    (set, get) => ({
      lang: detectLang(),
      theme: 'system',
      textSize: 'lg',
      areaUnit: 'acre',
      demoBannerDismissed: false,
      tourDone: false,
      langChosen: false,
      lastCheck: null,
      activeFarmId: null,
      simpleMode: null,
      setSimpleMode: (simpleMode) => set({ simpleMode }),
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      setTextSize: (textSize) => set({ textSize }),
      stepTextSize: (delta) => {
        const i = TEXT_SIZES.indexOf(get().textSize);
        const next = TEXT_SIZES[Math.min(TEXT_SIZES.length - 1, Math.max(0, i + delta))];
        set({ textSize: next });
      },
      setAreaUnit: (areaUnit) => set({ areaUnit }),
      dismissDemoBanner: () => set({ demoBannerDismissed: true }),
      setTourDone: (tourDone) => set({ tourDone }),
      chooseLang: (lang) => set({ lang, langChosen: true }),
      setLastCheck: (lastCheck) => set({ lastCheck }),
      setActiveFarmId: (activeFarmId) => set({ activeFarmId }),
    }),
    { name: 'cropwise-prefs' },
  ),
);
