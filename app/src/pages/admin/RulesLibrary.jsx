import { useState } from 'react';
import { FlaskConical, Leaf, Library, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useLang } from '@/hooks/useLang';
import { Badge, Card, EmptyState, ErrorState, Field, PageHeader, Pagination, SearchInput, SegmentedControl, Select, SkeletonCards } from '@/components/ui';
import { formatDate } from '@/utils/format';

export default function RulesLibrary() {
  const { t } = useTranslation();
  const lang = useLang();
  const [type, setType] = useState('');
  const [cropId, setCropId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebouncedValue(search, config.inputDebounceMs);
  const crops = useServiceQuery((s) => s.farms.listCrops(lang), [lang]);
  const rules = useServiceQuery((s) => s.admin.listRules({ lang, type: type || undefined, cropId: cropId || undefined, search: q, page, pageSize: 6 }), [lang, type, cropId, q, page]);

  return (
    <div>
      <PageHeader eyebrow={t('admin.eyebrow')} title={t('admin.rulesTitle')} subtitle={t('admin.rulesSubtitle')} actions={<Badge icon={Lock}>{t('admin.readOnly')}</Badge>} />
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="md:self-end">
          <SegmentedControl
            label={t('admin.ruleType')}
            value={type}
            onChange={(v) => { setType(v); setPage(1); }}
            options={[
              { value: '', label: t('common.all') },
              { value: 'chemical', label: t('advisory.chemicalShort'), icon: FlaskConical },
              { value: 'organic', label: t('advisory.organicShort'), icon: Leaf },
            ]}
          />
        </div>
        <Field label={t('wizard.crop')}>
          <Select value={cropId} onChange={(e) => { setCropId(e.target.value); setPage(1); }}>
            <option value="">{t('common.all')}</option>
            {(crops.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder={t('admin.searchRules')} className="md:self-end" />
      </div>
      {rules.loading ? (
        <SkeletonCards count={4} className="lg:grid-cols-2" cardClassName="h-64" />
      ) : rules.error ? (
        <ErrorState error={rules.error} onRetry={rules.reload} />
      ) : rules.data.items.length === 0 ? (
        <EmptyState icon={Library} title={t('admin.noRules')} description={t('reports.noMatchText')} />
      ) : (
        <>
          <ul className="grid gap-4 lg:grid-cols-2">
            {rules.data.items.map((r) => (
              <li key={r.id}>
                <Card tone={r.type === 'chemical' ? 'chem' : 'organic'} className="h-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={r.type === 'chemical' ? 'chem' : 'organic'} icon={r.type === 'chemical' ? FlaskConical : Leaf}>
                      {r.type === 'chemical' ? t('advisory.chemicalShort') : t('advisory.organicShort')}
                    </Badge>
                    <Badge tone="neutral">{r.cropName} · {r.diseaseName}</Badge>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold">{r.title}</h2>
                  <p className="text-sm text-ink-muted">{r.summary}</p>
                  <dl className="mt-4 divide-y divide-line rounded-lg border border-line text-sm">
                    {r.details.map((d) => (
                      <div key={d.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-3 px-3 py-2">
                        <dt className="font-semibold">{d.label}</dt>
                        <dd className="text-ink-muted">{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-3 text-xs text-ink-muted">{r.source} · {t('learn.updated', { date: formatDate(r.updatedAt, lang) })}</p>
                </Card>
              </li>
            ))}
          </ul>
          <Pagination page={rules.data.page} hasMore={rules.data.hasMore} total={rules.data.total} pageSize={rules.data.pageSize} onPage={setPage} />
        </>
      )}
    </div>
  );
}
