import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cx } from '@/utils/browser';

function LeafGlyph({ blur = false, small = false, many = false, dark = false }) {
  const leaf = 'M40 8 C 58 16, 68 34, 64 52 C 60 66, 50 72, 40 76 C 30 72, 20 66, 16 52 C 12 34, 22 16, 40 8 Z';
  return (
    <svg viewBox="0 0 80 84" className="h-full w-full" aria-hidden="true">
      <rect width="80" height="84" rx="8" fill={dark ? '#2a2a22' : '#E9E1CF'} />
      {many ? (
        <g opacity={dark ? 0.5 : 1}>
          <path d={leaf} fill="#5E8F3A" transform="translate(-14 4) scale(0.6)" />
          <path d={leaf} fill="#6FA046" transform="translate(30 0) scale(0.6)" />
          <path d={leaf} fill="#4C8A2F" transform="translate(10 34) scale(0.55)" />
        </g>
      ) : (
        <g style={{ filter: blur ? 'blur(3px)' : undefined }} transform={small ? 'translate(26 28) scale(0.35)' : undefined} opacity={dark ? 0.45 : 1}>
          <path d={leaf} fill="#5E8F3A" stroke="#2f5d1e" strokeWidth="2" />
          <path d="M40 12 L40 74" stroke="#2f5d1e" strokeWidth="2" />
          <circle cx="32" cy="38" r="5" fill="#5a3a1e" />
          <circle cx="47" cy="52" r="4" fill="#5a3a1e" />
        </g>
      )}
    </svg>
  );
}

/** Illustrated photo-quality guidance for leaf images. */
export default function PhotoTips() {
  const { t } = useTranslation();
  const tips = [
    { id: 'good', ok: true, glyph: <LeafGlyph /> },
    { id: 'blurry', ok: false, glyph: <LeafGlyph blur /> },
    { id: 'far', ok: false, glyph: <LeafGlyph small /> },
    { id: 'many', ok: false, glyph: <LeafGlyph many /> },
    { id: 'dark', ok: false, glyph: <LeafGlyph dark /> },
  ];
  return (
    <section aria-labelledby="photo-tips-title" className="rounded-xl border border-line bg-surface p-4">
      <h3 id="photo-tips-title" className="mb-3 font-sans text-base font-semibold">
        {t('upload.tipsTitle')}
      </h3>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {tips.map((tip) => (
          <li key={tip.id} className="flex flex-col gap-1.5">
            <div className={cx('relative aspect-[80/84] overflow-hidden rounded-lg ring-2', tip.ok ? 'ring-success' : 'ring-danger/60')}>
              {tip.glyph}
              <span
                className={cx('absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full text-white', tip.ok ? 'bg-success' : 'bg-danger')}
                aria-hidden="true"
              >
                {tip.ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </span>
            </div>
            <p className="text-xs leading-snug">
              <span className="sr-only">{tip.ok ? t('upload.tipDo') : t('upload.tipAvoid')}: </span>
              {t(`upload.tips.${tip.id}`)}
            </p>
          </li>
        ))}
      </ul>
      <ul className="mt-3 space-y-1 text-sm text-ink-muted">
        <li>• {t('upload.tipLight')}</li>
        <li>• {t('upload.tipSingle')}</li>
        <li>• {t('upload.tipClose')}</li>
      </ul>
    </section>
  );
}
