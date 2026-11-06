import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useLang } from '@/hooks/useLang';
import { Badge, Button, DataTable, EmptyState, ErrorState, PageHeader, Pagination, SkeletonCards } from '@/components/ui';
import { formatDate, formatPercent } from '@/utils/format';

const REASON_TONE = { low_confidence: 'warn', soil_unconfirmed: 'info', partial: 'danger' };

/** Analyses an agronomist should look at before the farmer acts. */
export default function ReviewQueue() {
  const { t } = useTranslation();
  const lang = useLang();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const q = useServiceQuery((s) => s.admin.listReviewQueue({ lang, page, pageSize: 10 }), [lang, page]);

  return (
    <div>
      <PageHeader eyebrow={t('admin.eyebrow')} title={t('expert.queueTitle')} subtitle={t('expert.queueSubtitle')} />
      {q.loading ? (
        <SkeletonCards count={4} cardClassName="h-16" />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={q.reload} />
      ) : (
        <>
          <DataTable
            caption={t('expert.queueTitle')}
            rows={q.data.items}
            rowKey={(r) => r.analysisId}
            empty={<EmptyState icon={ClipboardCheck} title={t('expert.queueEmpty')} />}
            columns={[
              { key: 'who', header: t('admin.farmers'), primary: true, render: (r) => <span><span className="block font-semibold">{r.farmerName}</span><span className="block text-xs text-ink-muted">{r.village}</span></span> },
              { key: 'what', header: t('reports.result'), render: (r) => `${r.cropName} · ${r.diseaseName ?? t('reports.noDiagnosis')}` },
              { key: 'conf', header: t('reports.confidence'), render: (r) => (r.confidence === null ? '—' : formatPercent(r.confidence, lang)) },
              { key: 'why', header: t('expert.reason'), render: (r) => <Badge tone={REASON_TONE[r.reason]} size="sm">{t(`expert.reasons.${r.reason}`)}</Badge> },
              { key: 'date', header: t('reports.date'), render: (r) => formatDate(r.createdAt, lang) },
              {
                key: 'act',
                header: '',
                render: (r) => (
                  <span className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" to={`/app/analysis/${r.analysisId}/diagnosis`}>{t('reports.open')}</Button>
                    <Button size="sm" onClick={() => navigate(`/app/admin/farmers/${r.farmerId}?analysis=${r.analysisId}`)}>{t('expert.advise')}</Button>
                  </span>
                ),
              },
            ]}
          />
          <Pagination page={q.data.page} hasMore={q.data.hasMore} total={q.data.total} pageSize={q.data.pageSize} onPage={setPage} />
        </>
      )}
    </div>
  );
}
