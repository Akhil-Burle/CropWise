import { useEffect, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowRight, ArrowUpRight, GitCompare, Minus, Plus, TestTube } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useChartColors } from '@/hooks/useEnvironment';
import { useLang } from '@/hooks/useLang';
import { Badge, Button, Card, CardHeader, DataTable, EmptyState, ErrorState, Field, PageHeader, Select, SkeletonCards } from '@/components/ui';
import FarmPicker, { useActiveFarm } from '@/components/features/common/FarmPicker';
import { StatusChip } from '@/components/features/soil/SoilBits';
import { formatDate, formatNumber } from '@/utils/format';

function TrendChart({ series }) {
  const { t } = useTranslation();
  const lang = useLang();
  const c = useChartColors();
  const values = series.points.map((p) => p.value);
  const lo = Math.min(...values, series.range.low ?? Infinity);
  const hi = Math.max(...values, series.range.high ?? -Infinity);
  const pad = (hi - lo) * 0.25 || 1;
  const data = series.points.map((p) => ({ ...p, label: formatDate(p.date, lang, { day: undefined }) }));
  const last = series.points[series.points.length - 1];
  return (
    <Card padded={false} className="p-4">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h3 className="font-sans text-base font-semibold">{t(`soil.nutrient.${series.key}`)}</h3>
        {last ? <span className="font-display text-lg font-semibold tabular">{formatNumber(last.value, lang)} <span className="font-sans text-xs text-ink-muted">{series.unit}</span></span> : null}
      </div>
      <div className="h-40" role="img" aria-label={t('soil.trendAria', { name: t(`soil.nutrient.${series.key}`), count: series.points.length })}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={c.line} strokeDasharray="3 4" vertical={false} />
            <ReferenceArea y1={series.range.low ?? lo - pad} y2={series.range.high ?? hi + pad} fill={c.sufficient} fillOpacity={0.08} />
            <XAxis dataKey="label" tick={{ fill: c['ink-muted'], fontSize: 10 }} tickLine={false} axisLine={{ stroke: c.line }} interval="preserveStartEnd" />
            <YAxis domain={[Number((lo - pad).toFixed(2)), Number((hi + pad).toFixed(2))]} tick={{ fill: c['ink-muted'], fontSize: 10 }} tickLine={false} axisLine={false} width={44} />
            <Tooltip contentStyle={{ background: c.surface, border: `1px solid ${c.line}`, borderRadius: 12, color: c.ink }} formatter={(v) => [`${formatNumber(v, lang)} ${series.unit}`, t(`soil.nutrientShort.${series.key}`)]} />
            <Line type="monotone" dataKey="value" stroke={c.clay} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function Comparison({ aId, bId }) {
  const { t } = useTranslation();
  const lang = useLang();
  const q = useServiceQuery((s) => s.soil.compare(aId, bId, lang), [aId, bId, lang], { enabled: Boolean(aId && bId && aId !== bId) });
  if (!aId || !bId || aId === bId) return <p className="text-sm text-ink-muted">{t('soil.pickTwo')}</p>;
  if (q.loading) return <SkeletonCards count={1} cardClassName="h-64" />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.reload} compact />;
  const { a, b, rows } = q.data;
  const Icon = (r) => (r.delta === null || r.delta === 0 ? Minus : r.delta > 0 ? ArrowUpRight : ArrowDownRight);
  return (
    <DataTable
      caption={t('soil.compareTitle')}
      rowKey={(r) => r.key}
      rows={rows}
      columns={[
        { key: 'name', header: t('soil.parameter'), primary: true, render: (r) => <span className="font-semibold">{t(`soil.nutrient.${r.key}`)}</span> },
        { key: 'a', header: formatDate(a.sampleDate, lang), render: (r) => <span className="flex flex-col items-start gap-1"><span className="tabular">{r.a ?? '—'} {r.unit}</span><StatusChip status={r.statusA} size="sm" /></span> },
        { key: 'b', header: formatDate(b.sampleDate, lang), render: (r) => <span className="flex flex-col items-start gap-1"><span className="tabular">{r.b ?? '—'} {r.unit}</span><StatusChip status={r.statusB} size="sm" /></span> },
        {
          key: 'delta',
          header: t('soil.change'),
          render: (r) => {
            const I = Icon(r);
            return (
              <span className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 tabular"><I className="h-4 w-4" aria-hidden="true" />{r.delta === null ? '—' : `${r.delta > 0 ? '+' : ''}${formatNumber(r.delta, lang)}`}</span>
                {r.improved === null ? null : <Badge tone={r.improved ? 'success' : 'danger'} size="sm">{r.improved ? t('soil.better') : t('soil.worse')}</Badge>}
              </span>
            );
          },
        },
      ]}
    />
  );
}

export default function SoilHistory() {
  const { t } = useTranslation();
  const lang = useLang();
  const farms = useServiceQuery((s) => s.farms.list({ pageSize: 50 }), []);
  const { farm, setFarmId } = useActiveFarm(farms.data?.items);
  const trend = useServiceQuery((s) => s.soil.getTrend(farm.id), [farm?.id], { enabled: Boolean(farm) });
  const reports = useServiceQuery((s) => s.soil.listReports(farm.id, { lang, pageSize: 50 }), [farm?.id, lang], { enabled: Boolean(farm) });
  const [aId, setAId] = useState('');
  const [bId, setBId] = useState('');

  useEffect(() => {
    const items = reports.data?.items ?? [];
    if (items.length >= 2) {
      setBId(items[0].id);
      setAId(items[items.length - 1].id);
    } else {
      setAId('');
      setBId('');
    }
  }, [reports.data]);

  if (farms.loading) return <SkeletonCards count={3} cardClassName="h-48" />;
  if (farms.error) return <ErrorState error={farms.error} onRetry={farms.reload} />;
  if (!farm) {
    return (
      <div>
        <PageHeader eyebrow={t('soil.eyebrow')} title={t('soil.title')} />
        <EmptyState icon={TestTube} title={t('dashboard.noFarms')} description={t('dashboard.noFarmsText')} action={<Button to="/app/farms" icon={Plus}>{t('farms.add')}</Button>} />
      </div>
    );
  }

  const list = reports.data?.items ?? [];
  return (
    <div>
      <PageHeader
        eyebrow={t('soil.eyebrow')}
        title={t('soil.title')}
        subtitle={t('soil.subtitle')}
        actions={<Button icon={Plus} to="/app/analysis/new">{t('soil.addTest')}</Button>}
      />
      <FarmPicker farms={farms.data.items} value={farm.id} onChange={setFarmId} className="mb-6 max-w-md" />

      {trend.loading ? (
        <SkeletonCards count={6} className="sm:grid-cols-2 xl:grid-cols-3" cardClassName="h-52" />
      ) : trend.error ? (
        <ErrorState error={trend.error} onRetry={trend.reload} />
      ) : trend.data.series.every((s) => s.points.length === 0) ? (
        <EmptyState icon={TestTube} title={t('soil.empty')} description={t('soil.emptyText')} action={<Button to="/app/analysis/new">{t('soil.addTest')}</Button>} />
      ) : (
        <section aria-labelledby="trend-title" className="mb-8">
          <h2 id="trend-title" className="mb-1 text-2xl font-semibold">{t('soil.trends')}</h2>
          <p className="mb-4 text-sm text-ink-muted">{t('soil.trendsHint')}</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {trend.data.series.map((s) => (s.points.length ? <TrendChart key={s.key} series={s} /> : null))}
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader icon={TestTube} title={t('soil.reports')} subtitle={t('soil.reportsCount', { count: list.length })} />
          {reports.loading ? (
            <SkeletonCards count={3} cardClassName="h-14" />
          ) : reports.error ? (
            <ErrorState error={reports.error} onRetry={reports.reload} compact />
          ) : list.length === 0 ? (
            <EmptyState compact icon={TestTube} title={t('soil.empty')} />
          ) : (
            <ul className="divide-y divide-line">
              {list.map((r) => {
                const def = r.values.filter((v) => v.status === 'deficient').length;
                const exc = r.values.filter((v) => v.status === 'excess').length;
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{formatDate(r.sampleDate, lang)}</p>
                      <p className="truncate text-sm text-ink-muted">{r.labName ?? t(`soil.source.${r.source}`)}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1">
                      <Badge tone="neutral" size="sm">{t(`soil.source.${r.source}`)}</Badge>
                      {def ? <Badge tone="deficient" size="sm">{t('soil.countDeficient', { count: def })}</Badge> : null}
                      {exc ? <Badge tone="excess" size="sm">{t('soil.countExcess', { count: exc })}</Badge> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card className="xl:col-span-3">
          <CardHeader icon={GitCompare} title={t('soil.compareTitle')} subtitle={t('soil.compareHint')} />
          {list.length >= 2 ? (
            <>
              <div className="mb-4 grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
                <Field label={t('soil.reportA')}>
                  <Select value={aId} onChange={(e) => setAId(e.target.value)}>
                    {list.map((r) => <option key={r.id} value={r.id}>{formatDate(r.sampleDate, lang)} · {t(`soil.source.${r.source}`)}</option>)}
                  </Select>
                </Field>
                <ArrowRight className="mx-auto mb-3 hidden h-5 w-5 text-ink-muted sm:block" aria-hidden="true" />
                <Field label={t('soil.reportB')}>
                  <Select value={bId} onChange={(e) => setBId(e.target.value)}>
                    {list.map((r) => <option key={r.id} value={r.id}>{formatDate(r.sampleDate, lang)} · {t(`soil.source.${r.source}`)}</option>)}
                  </Select>
                </Field>
              </div>
              <Comparison aId={aId} bId={bId} />
            </>
          ) : (
            <EmptyState compact icon={GitCompare} title={t('soil.needTwo')} />
          )}
        </Card>
      </div>
    </div>
  );
}
