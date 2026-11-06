import { AlertTriangle, Bookmark, BookmarkCheck, Clock, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui';
import { ToxicityDiamond } from '../advisory/Safety';
import { cx } from '@/utils/browser';

const TONE_BG = {
  forest: 'from-forest/20 to-forest/5 text-forest',
  clay: 'from-clay/20 to-clay/5 text-clay',
  ochre: 'from-ochre/25 to-ochre/5 text-clay',
  chem: 'from-chem/20 to-chem/5 text-chem',
  organic: 'from-organic/20 to-organic/5 text-organic',
};

export function ArticleCard({ article, onBookmark }) {
  const { t } = useTranslation();
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <div className={cx('relative h-24 bg-gradient-to-br', TONE_BG[article.tone])} aria-hidden="true">
        <svg viewBox="0 0 200 80" className="absolute inset-0 h-full w-full opacity-40" preserveAspectRatio="none">
          <path d="M0 60 C 40 40, 80 70, 120 50 S 180 30, 200 45 L200 80 L0 80 Z" fill="currentColor" />
          <path d="M0 70 C 50 55, 100 80, 150 62 S 190 55, 200 60 L200 80 L0 80 Z" fill="currentColor" opacity="0.6" />
        </svg>
        <span className="absolute left-4 top-3 font-display text-sm font-semibold uppercase tracking-wider">{t(`learn.category.${article.category}`)}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold leading-snug">
          <Link to={`/app/learn/${article.id}`} className="after:absolute after:inset-0 hover:underline focus-visible:underline">
            {article.title}
          </Link>
        </h3>
        <p className="mt-1 flex-1 text-sm text-ink-muted">{article.summary}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge size="sm" icon={Clock}>{t('learn.minutes', { count: article.readMinutes })}</Badge>
            <Badge size="sm" tone="neutral">{t(`learn.level.${article.level}`)}</Badge>
            {article.contentLang !== 'en' ? null : <Badge size="sm" tone="neutral">EN</Badge>}
          </div>
          <button
            type="button"
            onClick={() => onBookmark(article)}
            aria-pressed={article.bookmarked}
            aria-label={article.bookmarked ? t('learn.removeBookmark') : t('learn.bookmark')}
            title={article.bookmarked ? t('learn.removeBookmark') : t('learn.bookmark')}
            className="relative z-10 grid min-h-touch min-w-touch place-items-center rounded-md text-clay hover:bg-surface-2"
          >
            {article.bookmarked ? <BookmarkCheck className="h-5 w-5 fill-clay/20" aria-hidden="true" /> : <Bookmark className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </article>
  );
}

/** Renders server-driven article blocks. */
export function ArticleBody({ blocks }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5 text-[1.05rem]">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'p':
            return <p key={i}>{b.text}</p>;
          case 'h':
            return <h2 key={i} className="text-2xl font-semibold">{b.text}</h2>;
          case 'list':
            return (
              <ul key={i} className="list-disc space-y-1.5 pl-6">
                {b.items.map((x) => <li key={x}>{x}</li>)}
              </ul>
            );
          case 'steps':
            return (
              <ol key={i} className="space-y-3">
                {b.items.map((x, n) => (
                  <li key={x} className="flex gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-forest font-bold text-on-forest">{n + 1}</span>
                    <span className="pt-1">{x}</span>
                  </li>
                ))}
              </ol>
            );
          case 'ingredients':
            return (
              <div key={i} className="rounded-lg border border-line">
                <p className="border-b border-line bg-surface-2 px-4 py-2 font-semibold">{t('advisory.ingredients')}</p>
                <ul className="divide-y divide-line">
                  {b.items.map((x) => (
                    <li key={x.name} className="flex justify-between gap-3 px-4 py-2">
                      <span>{x.name}</span>
                      <span className="font-semibold tabular">{x.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          case 'tip':
            return (
              <p key={i} className="flex gap-3 rounded-lg border border-success/40 bg-success/5 p-4">
                <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                <span><strong>{t('learn.tip')}: </strong>{b.text}</span>
              </p>
            );
          case 'warning':
            return (
              <p key={i} className="flex gap-3 rounded-lg border-2 border-danger/50 bg-danger/5 p-4" role="note">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
                <span><strong>{t('learn.warning')}: </strong>{b.text}</span>
              </p>
            );
          case 'toxicity':
            return (
              <ul key={i} className="grid gap-3 sm:grid-cols-2">
                {b.items.map((x) => (
                  <li key={x.class} className="flex items-center gap-3 rounded-lg border border-line p-3">
                    <ToxicityDiamond toxClass={x.class} />
                    <span>
                      <span className="block font-semibold">{x.label}</span>
                      <span className="block text-sm text-ink-muted">{x.meaning}</span>
                    </span>
                  </li>
                ))}
              </ul>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
