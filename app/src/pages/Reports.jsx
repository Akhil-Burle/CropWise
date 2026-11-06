import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, FileSearch, ScanLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useLang } from '@/hooks/useLang';
import { Badge, Button, DataTable, EmptyState, ErrorState, Field, PageHeader, Pagination, SearchInput, Select, SkeletonCards } from '@/components/ui';
import { formatDate, formatPercent } from '@/utils/format';

const STATUS_TONE = { complete: 'success', partial: 'warn', needs_review: 'info' };

export default function Reports() {
  const { t } = useTranslation();
  const lang = useLang();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [cropId, setCropId] = useState('');
  const [status, setStatus] = useState('');
  const [farmId, setFarmId] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const q = useDebouncedValue(search, config.inputDebounceMs);
  const farms = useServiceQuery((s) => s.farms.list({ pageSize: 50 }), []);
  const crops = useServiceQuery((s) => s.farms.listCrops(lang), [lang]);
  const list = useServiceQuery(
    (s) => s.analysis.list({ lang, search: q, cropId: cropId || undefined, status: status || undefined, farmId: farmId || undefined, sort, page, pageSize: 8 }),
    [lang, q, cropId, status, farmId, sort, page],
  );
  const reset = (fn) => (e) => {
    fn(e.target.value);
    setPage(1);
  };
  const NEXT = { complete: 'advisory', needs_review: 'soil', partial: 'diagnosis' };
  const open = (row) => navigate(`/app/analysis/${row.id}/${NEXT[row.status]}`);

  return (
    <div>
      <PageHeader eyebrow={t('reports.eyebrow')} title={t('reports.title')} subtitle={t('reports.subtitle')} actions={<Button icon={ScanLine} to="/app/analysis/new">{t('nav.newAnalysis')}</Button>} />
      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder={t('reports.search')} className="md:col-span-2 xl:col-span-1 xl:self-end" />
        <Field label={t('wizard.crop')}>
          <Select value={cropId} onChange={reset(setCropId)}>
            <option value="">{t('common.all')}</option>
            {(crops.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label={t('wizard.farm')}>
          <Select value={farmId} onChange={reset(setFarmId)}>
            <option value="">{t('common.all')}</option>
            {(farms.data?.items ?? []).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Select>
        </Field>
        <Field label={t('reports.status')}>
          <Select value={status} onChange={reset(setStatus)}>
            <option value="">{t('common.all')}</option>
            {['complete', 'partial', 'needs_review'].map((s) => <option key={s} value={s}>{t(`reports.statusValue.${s}`)}</option>)}
          </Select>
        </Field>
        <Field label={t('reports.sort')}>
          <Select value={sort} onChange={reset(setSort)}>
            <option value="newest">{t('reports.newest')}</option>
            <option value="oldest">{t('reports.oldest')}</option>
          </Select>
        </Field>
      </div>

      {list.loading ? (
        <SkeletonCards count={4} cardClassName="h-16" />
      ) : list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : (
        <>
          <DataTable
            caption={t('reports.title')}
            rows={list.data.items}
            rowKey={(r) => r.id}
            onRowClick={open}
            rowLabel={t('reports.open')}
            empty={
              <EmptyState
                icon={FileSearch}
                title={q || cropId || status || farmId ? t('reports.noMatch') : t('reports.empty')}
                description={q || cropId || status || farmId ? t('reports.noMatchText') : t('reports.emptyText')}
                action={<Button to="/app/analysis/new" icon={ScanLine}>{t('nav.newAnalysis')}</Button>}
              />
            }
            columns={[
              {
                key: 'what',
                header: t('reports.result'),
                primary: true,
                render: (r) => (
                  <span className="flex items-center gap-2">
                    {r.saved ? <Bookmark className="h-4 w-4 shrink-0 fill-clay text-clay" aria-label={t('advisory.saved')} /> : null}
                    <span className="font-semibold">{r.cropName} · {r.diseaseName ?? t('reports.noDiagnosis')}</span>
                  </span>
                ),
              },
              { key: 'farm', header: t('wizard.farm'), render: (r) => r.farmName ?? '—' },
              { key: 'date', header: t('reports.date'), render: (r) => formatDate(r.createdAt, lang) },
              { key: 'conf', header: t('reports.confidence'), render: (r) => (r.confidence === null ? '—' : <Badge tone={r.confidence < 0.7 ? 'warn' : 'neutral'} size="sm">{formatPercent(r.confidence, lang)}</Badge>) },
              { key: 'status', header: t('reports.status'), render: (r) => <Badge tone={STATUS_TONE[r.status]} size="sm">{t(`reports.statusValue.${r.status}`)}</Badge> },
            ]}
          />
          <Pagination page={list.data.page} hasMore={list.data.hasMore} total={list.data.total} pageSize={list.data.pageSize} onPage={setPage} />
        </>
      )}
    </div>
  );
}
