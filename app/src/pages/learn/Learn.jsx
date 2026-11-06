import { useState } from 'react';
import { Bookmark, BookOpen, CheckCircle2, HelpCircle, Library, Scale, ShieldAlert, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { ARTICLE_CATEGORIES } from '@/types';
import { toAppError, useServices } from '@/services';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useLang } from '@/hooks/useLang';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { toast } from '@/store/toastStore';
import { Button, Card, ContentLangNotice, EmptyState, ErrorState, PageHeader, Pagination, SearchInput, SkeletonCards, Tabs, tabPanelProps } from '@/components/ui';
import { ArticleCard } from '@/components/features/learn/LearnBits';
import { cx } from '@/utils/browser';

function Articles({ category, bookmarkedOnly, search }) {
  const { t } = useTranslation();
  const lang = useLang();
  const services = useServices();
  const toMessage = useErrorMessage();
  const [page, setPage] = useState(1);
  const q = useServiceQuery((s) => s.learn.listArticles({ lang, category: category || undefined, bookmarkedOnly, search, page, pageSize: 9 }), [lang, category, bookmarkedOnly, search, page]);

  const onBookmark = async (article) => {
    q.setData((prev) => ({ ...prev, items: prev.items.map((a) => (a.id === article.id ? { ...a, bookmarked: !a.bookmarked } : a)) }));
    try {
      const r = await services.learn.toggleBookmark(article.id);
      toast.success(r.bookmarked ? t('learn.bookmarked') : t('learn.unbookmarked'));
      if (bookmarkedOnly) q.reload();
    } catch (e) {
      q.reload();
      toast.error(toMessage(toAppError(e))?.title ?? '');
    }
  };

  if (q.loading) return <SkeletonCards count={6} className="sm:grid-cols-2 xl:grid-cols-3" cardClassName="h-64" />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.reload} />;
  if (q.data.items.length === 0) {
    return bookmarkedOnly ? (
      <EmptyState icon={Bookmark} title={t('learn.noBookmarks')} description={t('learn.noBookmarksText')} />
    ) : (
      <EmptyState icon={BookOpen} title={t('learn.noResults')} description={t('learn.noResultsText')} />
    );
  }
  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {q.data.items.map((a) => (
          <li key={a.id} className="relative">
            <ArticleCard article={a} onBookmark={onBookmark} />
          </li>
        ))}
      </ul>
      <Pagination page={q.data.page} hasMore={q.data.hasMore} total={q.data.total} pageSize={q.data.pageSize} onPage={setPage} />
    </>
  );
}

function Myths() {
  const lang = useLang();
  const { t } = useTranslation();
  const q = useServiceQuery((s) => s.learn.listMyths(lang), [lang]);
  if (q.loading) return <SkeletonCards count={4} className="md:grid-cols-2" cardClassName="h-40" />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.reload} />;
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {q.data.map((m) => (
        <li key={m.id} className="overflow-hidden rounded-lg border border-line bg-surface">
          <div className="flex gap-3 bg-danger/5 p-4">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
            <p><span className="text-xs font-semibold uppercase tracking-wider text-danger">{t('learn.myth')}</span><br />{m.myth}</p>
          </div>
          <div className="flex gap-3 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
            <p><span className="text-xs font-semibold uppercase tracking-wider text-success">{t('learn.fact')}</span><br />{m.fact}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Glossary({ search }) {
  const lang = useLang();
  const { t } = useTranslation();
  const q = useServiceQuery((s) => s.learn.listGlossary({ lang, search }), [lang, search]);
  if (q.loading) return <SkeletonCards count={6} cardClassName="h-14" />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.reload} />;
  if (!q.data.length) return <EmptyState icon={Library} title={t('learn.noResults')} description={t('learn.noResultsText')} />;
  return (
    <dl className="grid gap-x-8 gap-y-4 rounded-lg border border-line bg-surface p-5 md:grid-cols-2">
      {q.data.map((g) => (
        <div key={g.id}>
          <dt className="font-semibold">{g.term}</dt>
          <dd className="text-sm text-ink-muted">{g.definition}</dd>
        </div>
      ))}
    </dl>
  );
}

function Quiz() {
  const { t } = useTranslation();
  const lang = useLang();
  const services = useServices();
  const q = useServiceQuery((s) => s.learn.getQuiz(lang), [lang]);
  const [answers, setAnswers] = useState({});
  const [checking, setChecking] = useState(null);
  const answer = async (questionId, optionId) => {
    if (answers[questionId]) return;
    setChecking(questionId);
    try {
      const r = await services.learn.checkAnswer({ questionId, optionId, lang });
      setAnswers((a) => ({ ...a, [questionId]: { ...r, chosen: optionId } }));
    } finally {
      setChecking(null);
    }
  };
  if (q.loading) return <SkeletonCards count={3} cardClassName="h-48" />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.reload} />;
  const answered = Object.values(answers);
  const score = answered.filter((a) => a.correct).length;
  return (
    <div className="space-y-4">
      <ContentLangNotice contentLang={q.data[0]?.contentLang} lang={lang} />
      <Card tone="inset" className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold" aria-live="polite">{t('learn.score', { score, total: q.data.length, answered: answered.length })}</p>
        {answered.length ? <Button variant="secondary" size="sm" onClick={() => setAnswers({})}>{t('learn.restartQuiz')}</Button> : null}
      </Card>
      <ol className="space-y-4">
        {q.data.map((question, qi) => {
          const res = answers[question.id];
          return (
            <li key={question.id}>
              <Card>
                <fieldset>
                  <legend className="mb-3 font-semibold">{qi + 1}. {question.question}</legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {question.options.map((o) => {
                      const isCorrect = res && o.id === res.correctOptionId;
                      const isWrongChoice = res && o.id === res.chosen && !res.correct;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          disabled={Boolean(res) || checking === question.id}
                          onClick={() => answer(question.id, o.id)}
                          aria-pressed={res?.chosen === o.id}
                          className={cx(
                            'flex min-h-touch items-center gap-2 rounded-lg border-2 px-3 py-2 text-left font-medium transition-colors',
                            !res && 'border-line hover:border-forest',
                            isCorrect && 'border-success bg-success/10',
                            isWrongChoice && 'border-danger bg-danger/10',
                            res && !isCorrect && !isWrongChoice && 'border-line opacity-60',
                          )}
                        >
                          {isCorrect ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden="true" /> : isWrongChoice ? <XCircle className="h-5 w-5 shrink-0 text-danger" aria-hidden="true" /> : null}
                          {o.text}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                {res ? (
                  <p className={cx('mt-3 rounded-md p-3 text-sm', res.correct ? 'bg-success/10' : 'bg-danger/10')} role="status">
                    <strong>{res.correct ? t('learn.correct') : t('learn.incorrect')}</strong> {res.explanation}
                  </p>
                ) : null}
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function Learn() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('articles');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, config.inputDebounceMs);
  const base = 'learn';
  const searchable = tab === 'articles' || tab === 'glossary' || tab === 'bookmarks';

  return (
    <div>
      <PageHeader eyebrow={t('learn.eyebrow')} title={t('learn.title')} subtitle={t('learn.subtitle')} />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <Tabs
          label={t('learn.title')}
          idBase={base}
          value={tab}
          onChange={setTab}
          className="lg:flex-1"
          tabs={[
            { id: 'articles', label: t('learn.tabs.articles'), icon: BookOpen },
            { id: 'safety', label: t('learn.tabs.safety'), icon: ShieldAlert },
            { id: 'myths', label: t('learn.tabs.myths'), icon: Scale },
            { id: 'glossary', label: t('learn.tabs.glossary'), icon: Library },
            { id: 'quiz', label: t('learn.tabs.quiz'), icon: HelpCircle },
            { id: 'bookmarks', label: t('learn.tabs.bookmarks'), icon: Bookmark },
          ]}
        />
        {searchable ? <SearchInput value={search} onChange={setSearch} placeholder={t('learn.search')} className="lg:w-72" /> : null}
      </div>

      <div {...tabPanelProps(base, 'articles', tab)}>
        {tab === 'articles' ? (
          <>
            <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label={t('learn.filterCategory')}>
              {['', ...ARTICLE_CATEGORIES].map((c) => (
                <button
                  key={c || 'all'}
                  type="button"
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                  className={cx('min-h-[40px] rounded-full border px-4 text-sm font-semibold', category === c ? 'border-forest bg-forest text-on-forest' : 'border-line bg-surface hover:border-forest/50')}
                >
                  {c ? t(`learn.category.${c}`) : t('common.all')}
                </button>
              ))}
            </div>
            <Articles category={category} bookmarkedOnly={false} search={debounced} />
          </>
        ) : null}
      </div>
      <div {...tabPanelProps(base, 'safety', tab)}>
        {tab === 'safety' ? (
          <>
            <Card tone="danger" className="mb-4">
              <p className="flex items-center gap-2 font-semibold"><ShieldAlert className="h-5 w-5 text-danger" aria-hidden="true" />{t('learn.safetyIntro')}</p>
              <p className="mt-1 text-sm text-ink-muted">{t('learn.safetyIntroText')}</p>
            </Card>
            <Articles category="safety" bookmarkedOnly={false} search="" />
          </>
        ) : null}
      </div>
      <div {...tabPanelProps(base, 'myths', tab)}>{tab === 'myths' ? <Myths /> : null}</div>
      <div {...tabPanelProps(base, 'glossary', tab)}>{tab === 'glossary' ? <Glossary search={debounced} /> : null}</div>
      <div {...tabPanelProps(base, 'quiz', tab)}>{tab === 'quiz' ? <Quiz /> : null}</div>
      <div {...tabPanelProps(base, 'bookmarks', tab)}>{tab === 'bookmarks' ? <Articles category="" bookmarkedOnly search={debounced} /> : null}</div>
    </div>
  );
}
