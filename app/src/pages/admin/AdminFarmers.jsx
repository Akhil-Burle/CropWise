import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useLang } from '@/hooks/useLang';
import { Badge, DataTable, EmptyState, ErrorState, Field, PageHeader, Pagination, SearchInput, Select, SkeletonCards } from '@/components/ui';
import { formatDate, formatNumber } from '@/utils/format';

const ADOPTION_TONE = { chemical: 'chem', organic: 'organic', mixed: 'ochre', none: 'neutral' };

export default function AdminFarmers() {
  const { t } = useTranslation();
  const lang = useLang();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [adoption, setAdoption] = useState('');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const q = useDebouncedValue(search, config.inputDebounceMs);
  const regions = useServiceQuery((s) => s.farms.listRegions(), []);
  const districts = (regions.data ?? []).flatMap((r) => r.districts);
  const list = useServiceQuery(
    (s) => s.admin.listFarmers({ search: q, district: district || undefined, adoption: adoption || undefined, sort, page, pageSize: 10 }),
    [q, district, adoption, sort, page],
  );
  const reset = (fn) => (e) => {
    fn(e.target.value);
    setPage(1);
  };

  return (
    <div>
      <PageHeader eyebrow={t('admin.eyebrow')} title={t('admin.farmersTitle')} subtitle={t('admin.farmersSubtitle')} />
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder={t('admin.searchFarmers')} className="md:self-end" />
        <Field label={t('farms.district')}>
          <Select value={district} onChange={reset(setDistrict)}>
            <option value="">{t('common.all')}</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </Field>
        <Field label={t('admin.adoption')}>
          <Select value={adoption} onChange={reset(setAdoption)}>
            <option value="">{t('common.all')}</option>
            {['chemical', 'mixed', 'organic', 'none'].map((a) => <option key={a} value={a}>{t(`admin.adoptionLevel.${a}`)}</option>)}
          </Select>
        </Field>
        <Field label={t('reports.sort')}>
          <Select value={sort} onChange={reset(setSort)}>
            <option value="recent">{t('admin.sortRecent')}</option>
            <option value="name">{t('admin.sortName')}</option>
          </Select>
        </Field>
      </div>
      {list.loading ? (
        <SkeletonCards count={5} cardClassName="h-14" />
      ) : list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : (
        <>
          <DataTable
            caption={t('admin.farmersTitle')}
            rows={list.data.items}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/app/admin/farmers/${r.id}`)}
            rowLabel={t('expert.openFarmer')}
            empty={<EmptyState icon={Users} title={t('admin.noFarmers')} description={t('reports.noMatchText')} />}
            columns={[
              { key: 'name', header: t('settings.name'), primary: true, render: (r) => <span><span className="block font-semibold">{r.name}</span><span className="block text-xs text-ink-muted tabular">{r.phone}</span></span> },
              { key: 'place', header: t('admin.place'), render: (r) => `${r.village}, ${r.district}` },
              { key: 'farms', header: t('nav.farms'), render: (r) => `${r.farmCount} · ${formatNumber(r.totalArea, lang)} ${t('units.acre', { count: r.totalArea })}` },
              { key: 'last', header: t('admin.lastAnalysis'), render: (r) => (r.lastAnalysisAt ? formatDate(r.lastAnalysisAt, lang) : t('admin.never')) },
              { key: 'adoption', header: t('admin.adoption'), render: (r) => <Badge tone={ADOPTION_TONE[r.adoption]} size="sm">{t(`admin.adoptionLevel.${r.adoption}`)}</Badge> },
            ]}
          />
          <Pagination page={list.data.page} hasMore={list.data.hasMore} total={list.data.total} pageSize={list.data.pageSize} onPage={setPage} />
        </>
      )}
    </div>
  );
}
