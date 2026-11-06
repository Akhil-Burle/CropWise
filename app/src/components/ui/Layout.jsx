import { ArrowLeft, ChevronLeft, ChevronRight, Globe2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cx } from '@/utils/browser';
import Button from './Button';

export function PageHeader({ eyebrow, title, subtitle, actions, backTo, backLabel, className }) {
  const { t } = useTranslation();
  return (
    <header className={cx('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {backTo ? (
          <Button variant="ghost" size="sm" icon={ArrowLeft} to={backTo} className="-ml-3 mb-2 no-print">
            {backLabel ?? t('common.back')}
          </Button>
        ) : null}
        {eyebrow ? <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-clay">{eyebrow}</p> : null}
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-ink-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2 no-print">{actions}</div> : null}
    </header>
  );
}

export function Spinner({ label, className }) {
  return (
    <span role="status" className={cx('inline-flex items-center gap-2 text-ink-muted', className)}>
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className={label ? 'text-sm' : 'sr-only'}>{label}</span>
    </span>
  );
}

export function Pagination({ page, hasMore, total, pageSize, onPage }) {
  const { t } = useTranslation();
  if (page === 1 && !hasMore) return null;
  const pages = total ? Math.max(1, Math.ceil(total / pageSize)) : null;
  return (
    <nav className="mt-4 flex items-center justify-between gap-3" aria-label={t('common.pagination')}>
      <Button variant="secondary" icon={ChevronLeft} disabled={page <= 1} onClick={() => onPage(page - 1)}>
        {t('common.previous')}
      </Button>
      <span className="text-sm text-ink-muted tabular">{pages ? t('common.pageOf', { page, pages }) : t('common.page', { page })}</span>
      <Button variant="secondary" iconRight={ChevronRight} disabled={!hasMore} onClick={() => onPage(page + 1)}>
        {t('common.next')}
      </Button>
    </nav>
  );
}

/** Shown when server-driven content fell back to another language. */
export function ContentLangNotice({ contentLang, lang, className }) {
  const { t } = useTranslation();
  if (!contentLang || contentLang === lang) return null;
  return (
    <p className={cx('flex items-center gap-2 rounded-md bg-surface-2 px-3 py-2 text-sm text-ink-muted', className)}>
      <Globe2 className="h-4 w-4 shrink-0" aria-hidden="true" />
      {t('common.contentFallback')}
    </p>
  );
}

export function Disclosure({ summary, children, defaultOpen = false, icon: Icon, className }) {
  return (
    <details open={defaultOpen} className={cx('group rounded-lg border border-line bg-surface', className)}>
      <summary className="flex min-h-touch cursor-pointer list-none items-center gap-3 px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
        {Icon ? <Icon className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" /> : null}
        <span className="flex-1">{summary}</span>
        <ChevronRight className="h-5 w-5 shrink-0 text-ink-muted transition-transform group-open:rotate-90" aria-hidden="true" />
      </summary>
      <div className="border-t border-line px-4 py-3">{children}</div>
    </details>
  );
}
