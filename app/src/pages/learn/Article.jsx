import { useParams } from 'react-router-dom';
import { Bookmark, BookmarkCheck, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toAppError, useServices } from '@/services';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useLang } from '@/hooks/useLang';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { toast } from '@/store/toastStore';
import { Badge, Button, ContentLangNotice, ErrorState, PageHeader, SkeletonText } from '@/components/ui';
import { ArticleBody } from '@/components/features/learn/LearnBits';
import ReadAloudButton from '@/components/features/common/ReadAloudButton';
import { formatDate } from '@/utils/format';

function blocksToText(blocks) {
  return blocks
    .map((b) => ('text' in b ? b.text : b.type === 'ingredients' ? b.items.map((i) => `${i.quantity} ${i.name}`).join(', ') : b.type === 'toxicity' ? b.items.map((i) => `${i.label}: ${i.meaning}`).join('. ') : b.items.join('. ')))
    .join('. ');
}

export default function Article() {
  const { t } = useTranslation();
  const lang = useLang();
  const { articleId } = useParams();
  const services = useServices();
  const toMessage = useErrorMessage();
  const q = useServiceQuery((s) => s.learn.getArticle(articleId, lang), [articleId, lang]);

  const toggle = async () => {
    try {
      const r = await services.learn.toggleBookmark(articleId);
      q.setData((a) => ({ ...a, bookmarked: r.bookmarked }));
      toast.success(r.bookmarked ? t('learn.bookmarked') : t('learn.unbookmarked'));
    } catch (e) {
      toast.error(toMessage(toAppError(e))?.title ?? '');
    }
  };

  if (q.loading) return <div className="mx-auto max-w-3xl space-y-6"><SkeletonText lines={2} /><SkeletonText lines={8} /></div>;
  if (q.error) return <ErrorState error={q.error} onRetry={q.reload} />;
  const a = q.data;

  return (
    <article className="mx-auto max-w-3xl">
      <PageHeader
        backTo="/app/learn"
        backLabel={t('learn.back')}
        eyebrow={t(`learn.category.${a.category}`)}
        title={a.title}
        subtitle={a.summary}
        actions={
          <>
            <Button variant="secondary" icon={a.bookmarked ? BookmarkCheck : Bookmark} onClick={toggle} aria-pressed={a.bookmarked}>
              {a.bookmarked ? t('learn.bookmarkedShort') : t('learn.bookmark')}
            </Button>
            <ReadAloudButton getText={() => `${a.title}. ${blocksToText(a.blocks)}`} />
          </>
        }
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <Badge icon={Clock}>{t('learn.minutes', { count: a.readMinutes })}</Badge>
        <Badge tone="neutral">{t(`learn.level.${a.level}`)}</Badge>
        <Badge tone="neutral">{t('learn.updated', { date: formatDate(a.updatedAt, lang) })}</Badge>
      </div>
      <ContentLangNotice contentLang={a.contentLang} lang={lang} className="mb-6" />
      <ArticleBody blocks={a.blocks} />
      {a.source ? <p className="mt-8 border-t border-line pt-4 text-sm text-ink-muted">{t('learn.source')}: {a.source}</p> : null}
    </article>
  );
}
