import { useEffect, useState } from 'react';
import { usePrefs } from '@/store/prefsStore';

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

export function useMediaQuery(query: string): boolean {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const handler = () => setMatches(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

/** Resolved theme (system preference applied). */
export function useIsDark(): boolean {
  const theme = usePrefs((s) => s.theme);
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  return theme === 'dark' || (theme === 'system' && systemDark);
}

/** Applies theme class, text size and document language to <html>. */
export function useApplyPrefs(): void {
  const dark = useIsDark();
  const textSize = usePrefs((s) => s.textSize);
  const lang = usePrefs((s) => s.lang);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.dataset.textSize = textSize;
    root.lang = lang;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0F1612' : '#1F4D33');
  }, [dark, textSize, lang]);
}

const VARS = ['forest', 'clay', 'ochre', 'chem', 'organic', 'ink', 'ink-muted', 'line', 'surface', 'deficient', 'sufficient', 'excess'] as const;
export type ChartColors = Record<(typeof VARS)[number], string>;

/** Chart colours read from CSS variables so Recharts follows the active theme. */
export function useChartColors(): ChartColors {
  const dark = useIsDark();
  const read = (): ChartColors => {
    const style = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
    return Object.fromEntries(
      VARS.map((v) => {
        const raw = style?.getPropertyValue(`--c-${v}`).trim();
        return [v, raw ? `rgb(${raw.split(/\s+/).join(',')})` : '#888'];
      }),
    ) as ChartColors;
  };
  const [colors, setColors] = useState<ChartColors>(read);
  useEffect(() => {
    // Wait a frame so the theme class is applied before reading variables.
    const id = requestAnimationFrame(() => setColors(read()));
    return () => cancelAnimationFrame(id);
  }, [dark]);
  return colors;
}
