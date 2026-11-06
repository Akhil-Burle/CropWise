import { Volume2 } from 'lucide-react';
import { LANGUAGE_OPTIONS } from '@/i18n';
import { usePrefs } from '@/store/prefsStore';
import { LogoMark } from '../brand/Logo';

/**
 * First launch: pick a language before anything else. Each option is written in its own
 * script, with the English name small underneath, so nobody needs to read English first.
 */
export default function LanguageGate({ children }) {
  const chosen = usePrefs((s) => s.langChosen);
  const chooseLang = usePrefs((s) => s.chooseLang);
  if (chosen) return children;
  return (
    <main className="min-h-screen bg-bg paper-grain px-4 py-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center gap-3">
          <LogoMark className="h-12 w-12" />
          <Volume2 className="h-7 w-7 text-forest" aria-hidden="true" />
        </div>
        <h1 className="mb-1 text-2xl font-semibold" lang="en">Choose your language</h1>
        <p className="mb-6 text-lg text-ink-muted" lang="hi">अपनी भाषा चुनें · ನಿಮ್ಮ ಭಾಷೆ ಆರಿಸಿ</p>
        <ul className="grid gap-3 sm:grid-cols-3">
          {LANGUAGE_OPTIONS.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                lang={l.code}
                onClick={() => chooseLang(l.code)}
                className="flex min-h-[80px] w-full flex-col items-start justify-center rounded-xl border-2 border-line bg-surface px-4 text-left hover:border-forest focus-visible:border-forest"
              >
                <span className="text-2xl font-bold">{l.label}</span>
                <span className="text-sm text-ink-muted" lang="en">{l.english}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
