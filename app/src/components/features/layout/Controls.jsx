import { useEffect, useRef, useState } from 'react';
import { Check, Languages, Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_OPTIONS } from '@/i18n';
import { usePrefs } from '@/store/prefsStore';
import { useIsDark } from '@/hooks/useEnvironment';
import { cx } from '@/utils/browser';

/** Language picker: always shows the language's own name so non-English readers can find theirs. */
export function LanguageSwitcher({ compact = false, className }) {
  const { t } = useTranslation();
  const lang = usePrefs((s) => s.lang);
  const setLang = usePrefs((s) => s.setLang);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGUAGE_OPTIONS.find((l) => l.code === lang) ?? LANGUAGE_OPTIONS[0];

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div ref={ref} className={cx('relative', className)} data-tour="lang">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t('settings.language')}: ${current.label}`}
        className="flex min-h-touch items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-sm font-semibold hover:bg-surface-2"
      >
        <Languages className="h-5 w-5 text-forest" aria-hidden="true" />
        <span>{compact ? current.short : current.label}</span>
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label={t('settings.language')}
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-pop"
        >
          {LANGUAGE_OPTIONS.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === lang}>
              <button
                type="button"
                lang={l.code}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className="flex min-h-touch w-full items-center justify-between px-4 text-left hover:bg-surface-2"
              >
                <span className="font-medium">{l.label}</span>
                {l.code === lang ? <Check className="h-4 w-4 text-forest" aria-hidden="true" /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ThemeToggle({ className }) {
  const { t } = useTranslation();
  const dark = useIsDark();
  const setTheme = usePrefs((s) => s.setTheme);
  const label = dark ? t('settings.themeLight') : t('settings.themeDark');
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className={cx('grid min-h-touch min-w-touch place-items-center rounded-md border border-line bg-surface hover:bg-surface-2', className)}
      aria-label={label}
      title={label}
    >
      {dark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}

export const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor };
