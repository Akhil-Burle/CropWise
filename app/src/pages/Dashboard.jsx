import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  FlaskConical,
  Leaf,
  MapPin,
  MessageCircle,
  Microscope,
  Plus,
  Recycle,
  ScanLine,
  ShieldCheck,
  TestTube,
  Tractor,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, CardHeader, EmptyState, ErrorState, Skeleton, SkeletonCards } from '@/components/ui';
import { SoilSnapshot } from '@/components/features/soil/SoilBits';
import WeatherWidget from '@/components/features/common/WeatherWidget';
import FarmPicker, { useActiveFarm } from '@/components/features/common/FarmPicker';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useLang } from '@/hooks/useLang';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatNumber, formatPercent } from '@/utils/format';
import { cx } from '@/utils/browser';

function QuickActions() {
  const { t } = useTranslation();
  const actions = [
    { to: '/app/analysis/new', icon: ScanLine, label: t('dashboard.qa.analyse'), hint: t('dashboard.qa.analyseHint'), primary: true },
    { to: '/app/tracker', icon: CalendarDays, label: t('dashboard.qa.tracker'), hint: t('dashboard.qa.trackerHint') },
    { to: '/app/transition', icon: Recycle, label: t('dashboard.qa.transition'), hint: t('dashboard.qa.transitionHint') },
    { to: '/app/help', icon: MessageCircle, label: t('dashboard.qa.expert'), hint: t('dashboard.qa.expertHint') },
  ];
  return (
    <nav aria-label={t('dashboard.quickActions')} data-tour="quick-actions" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.to}
            to={a.to}
            className={cx(
              'group flex min-h-[88px] flex-col justify-between gap-2 rounded-lg border p-4 transition-colors',
              a.primary ? 'border-forest bg-forest text-on-forest hover:bg-forest/90' : 'border-line bg-surface hover:border-forest/50',
            )}
          >
            <Icon className={cx('h-6 w-6', a.primary ? 'text-ochre' : 'text-forest')} aria-hidden="true" />
            <span>
              <span className="block font-semibold leading-tight">{a.label}</span>
              <span className={cx('block text-xs', a.primary ? 'text-on-forest/80' : 'text-ink-muted')}>{a.hint}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function PhiAlerts() {
  const { t } = useTranslation();
  const lang = useLang();
  const q = useServiceQuery((s) => s.treatments.getPhiAlerts(lang), [lang]);
  return (
    <Card tone={q.data?.length ? 'danger' : 'default'} data-tour="phi-alerts" aria-live="polite">
      <CardHeader icon={Clock} iconClassName="bg-danger/10 text-danger" title={t('dashboard.phiTitle')} subtitle={t('dashboard.phiSubtitle')} />
      {q.loading ? (
        <Skeleton className="h-20" />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={q.reload} compact />
      ) : q.data.length === 0 ? (
        <p className="flex items-center gap-2 text-sm"><ShieldCheck className="h-5 w-5 text-success" aria-hidden="true" />{t('dashboard.phiNone')}</p>
      ) : (
        <ul className="space-y-3">
          {q.data.map((a) => (
            <li key={a.treatmentId} className="flex items-center gap-4 rounded-lg bg-surface p-3">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-danger text-white dark:text-forest-deep">
                <span className="text-center leading-none">
                  <span className="block font-display text-2xl font-bold tabular">{a.daysRemaining}</span>
                  <span className="text-[0.65rem] font-semibold uppercase">{t('dashboard.days', { count: a.daysRemaining })}</span>
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold">{t('dashboard.safeIn', { count: a.daysRemaining })}</p>
                <p className="text-sm text-ink-muted">
                  {a.cropName} · {a.farmName}
                </p>
                <p className="text-sm text-ink-muted">
                  {a.product} · {t('dashboard.safeOn', { date: formatDate(a.safeDate, lang) })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function FarmCards({ farms, crops, activeId, onSelect }) {
  const { t } = useTranslation();
  const lang = useLang();
  const cropName = (id) => crops?.find((c) => c.id === id)?.name ?? id;
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {farms.map((f) => (
        <li key={f.id}>
          <button
            type="button"
            onClick={() => onSelect(f.id)}
            aria-pressed={f.id === activeId}
            className={cx(
              'flex h-full w-full flex-col gap-1 rounded-lg border bg-surface p-4 text-left transition-colors',
              f.id === activeId ? 'border-forest ring-2 ring-forest/20' : 'border-line hover:border-forest/40',
            )}
          >
            <span className="flex items-center gap-2 text-sm text-ink-muted"><MapPin className="h-4 w-4" aria-hidden="true" />{f.village}, {f.district}</span>
            <span className="font-display text-lg font-semibold leading-snug">{f.name}</span>
            <span className="text-sm">
              {f.cropIds.map(cropName).join(', ')} · {formatNumber(f.area, lang)} {t(`units.${f.areaUnit}`, { count: f.area })}
            </span>
            <span className="text-xs text-ink-muted">{t('dashboard.lastSoilTest', { date: formatDate(f.lastSoilTestDate, lang) })}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function SoilCard({ farmId }) {
  const { t } = useTranslation();
  const lang = useLang();
  const q = useServiceQuery((s) => s.soil.getLatest(farmId, lang), [farmId, lang], { enabled: Boolean(farmId) });
  return (
    <Card>
      <CardHeader
        icon={TestTube}
        title={t('dashboard.soilTitle')}
        subtitle={q.data ? t('dashboard.soilTested', { date: formatDate(q.data.sampleDate, lang) }) : t('dashboard.soilSubtitle')}
        action={<Button variant="ghost" size="sm" to="/app/soil" iconRight={ArrowRight}>{t('dashboard.history')}</Button>}
      />
      {q.loading ? (
        <SkeletonCards count={3} cardClassName="h-10" />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={q.reload} compact />
      ) : !q.data ? (
        <EmptyState compact icon={TestTube} title={t('dashboard.soilEmpty')} description={t('dashboard.soilEmptyText')} action={<Button to="/app/analysis/new" icon={Plus}>{t('dashboard.uploadCard')}</Button>} />
      ) : (
        <SoilSnapshot report={q.data} compact />
      )}
    </Card>
  );
}

function RecentDiagnoses() {
  const { t } = useTranslation();
  const lang = useLang();
  const navigate = useNavigate();
  const q = useServiceQuery((s) => s.analysis.list({ lang, pageSize: 4 }), [lang]);
  return (
    <Card>
      <CardHeader
        icon={Microscope}
        title={t('dashboard.recentTitle')}
        action={<Button variant="ghost" size="sm" to="/app/reports" iconRight={ArrowRight}>{t('dashboard.viewAll')}</Button>}
      />
      {q.loading ? (
        <SkeletonCards count={3} cardClassName="h-14" />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={q.reload} compact />
      ) : q.data.items.length === 0 ? (
        <EmptyState compact icon={Leaf} title={t('dashboard.recentEmpty')} description={t('dashboard.recentEmptyText')} action={<Button to="/app/analysis/new" icon={ScanLine}>{t('nav.newAnalysis')}</Button>} />
      ) : (
        <ul className="divide-y divide-line">
          {q.data.items.map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => navigate(`/app/analysis/${a.id}/advisory`)} className="flex min-h-touch w-full items-center gap-3 py-3 text-left">
                <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-full', a.isHealthy ? 'bg-success/10 text-success' : 'bg-clay/10 text-clay')} aria-hidden="true">
                  {a.isHealthy ? <CheckCircle2 className="h-5 w-5" /> : <Leaf className="h-5 w-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {a.cropName} · {a.diseaseName ?? t('reports.noDiagnosis')}
                  </span>
                  <span className="block text-sm text-ink-muted">
                    {formatDate(a.createdAt, lang)} · {a.farmName}
                  </span>
                </span>
                {a.confidence !== null ? <Badge tone={a.confidence < 0.7 ? 'warn' : 'neutral'} size="sm">{formatPercent(a.confidence, lang)}</Badge> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function UpcomingTreatments() {
  const { t } = useTranslation();
  const lang = useLang();
  const q = useServiceQuery((s) => s.treatments.list({ lang, openOnly: true, pageSize: 5, sort: 'date_asc' }), [lang]);
  const { loading, error } = q;
  const items = q.data?.items ?? [];
  return (
    <Card>
      <CardHeader
        icon={CalendarDays}
        title={t('dashboard.upcomingTitle')}
        action={<Button variant="ghost" size="sm" to="/app/tracker" iconRight={ArrowRight}>{t('nav.tracker')}</Button>}
      />
      {loading ? (
        <SkeletonCards count={3} cardClassName="h-14" />
      ) : error ? (
        <ErrorState error={error} onRetry={q.reload} compact />
      ) : items.length === 0 ? (
        <EmptyState compact icon={CalendarDays} title={t('dashboard.upcomingEmpty')} description={t('dashboard.upcomingEmptyText')} />
      ) : (
        <ul className="space-y-2">
          {items.map((tr) => (
            <li key={tr.id} className="flex items-center gap-3 rounded-lg border border-line p-3">
              <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-md', tr.type === 'chemical' ? 'bg-chem-soft text-chem' : 'bg-organic-soft text-organic')} aria-hidden="true">
                {tr.type === 'chemical' ? <FlaskConical className="h-5 w-5" /> : <Leaf className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{tr.title}</p>
                <p className="truncate text-sm text-ink-muted">{tr.farmName}</p>
              </div>
              <div className="text-right">
                {tr.status === 'overdue' ? (
                  <Badge tone="danger" icon={AlertTriangle} size="sm">{t('tracker.status.overdue')}</Badge>
                ) : (
                  <span className="text-sm font-semibold">{formatDate(tr.scheduledDate, lang, { year: undefined })}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function SeasonTimeline({ farmId }) {
  const { t } = useTranslation();
  const lang = useLang();
  const q = useServiceQuery((s) => s.farms.getSeasonTimeline(farmId, lang), [farmId, lang], { enabled: Boolean(farmId) });
  return (
    <Card>
      <CardHeader icon={Tractor} title={t('dashboard.seasonTitle')} subtitle={t('dashboard.seasonSubtitle')} />
      {q.loading ? (
        <Skeleton className="h-24" />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={q.reload} compact />
      ) : (
        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          {q.data.map((p) => (
            <li
              key={p.id}
              className={cx(
                'relative rounded-lg border p-3',
                p.status === 'current' && 'border-forest bg-forest/5 ring-2 ring-forest/20',
                p.status === 'done' && 'border-line bg-surface-2/60',
                p.status === 'upcoming' && 'border-dashed border-line',
              )}
              aria-current={p.status === 'current' ? 'step' : undefined}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{t(`season.${p.status}`)}</p>
              <p className="font-semibold leading-snug">{p.label}</p>
              <p className="text-xs text-ink-muted">
                {formatDate(p.start, lang, { year: undefined })} – {formatDate(p.end, lang, { year: undefined })}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const lang = useLang();
  const user = useAuthStore((s) => s.user);
  const farms = useServiceQuery((s) => s.farms.list({ pageSize: 50 }), []);
  const crops = useServiceQuery((s) => s.farms.listCrops(lang), [lang]);
  const { farm, setFarmId } = useActiveFarm(farms.data?.items);
  const firstName = user?.name.replace(/^Dr\.?\s+/i, '').split(' ')[0] ?? '';

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-clay">{formatDate(new Date().toISOString(), lang, { weekday: 'long' })}</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">{t('dashboard.greeting', { name: firstName })}</h1>
          <p className="mt-1 text-ink-muted">{t('dashboard.intro')}</p>
        </div>
        {farms.data?.items.length ? (
          <FarmPicker farms={farms.data.items} value={farm?.id} onChange={setFarmId} className="w-full lg:w-80" />
        ) : null}
      </header>

      <QuickActions />

      {farms.loading ? (
        <SkeletonCards count={3} className="sm:grid-cols-3" cardClassName="h-28" />
      ) : farms.error ? (
        <ErrorState error={farms.error} onRetry={farms.reload} />
      ) : farms.data.items.length === 0 ? (
        <EmptyState icon={Tractor} title={t('dashboard.noFarms')} description={t('dashboard.noFarmsText')} action={<Button to="/app/farms" icon={Plus}>{t('farms.add')}</Button>} />
      ) : (
        <section aria-labelledby="farms-heading">
          <h2 id="farms-heading" className="sr-only">{t('nav.farms')}</h2>
          <FarmCards farms={farms.data.items} crops={crops.data} activeId={farm?.id} onSelect={setFarmId} />
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PhiAlerts />
          {farm ? <SeasonTimeline farmId={farm.id} /> : null}
          <div className="grid gap-6 md:grid-cols-2">
            <RecentDiagnoses />
            <UpcomingTreatments />
          </div>
        </div>
        <div className="space-y-6">
          {farm ? <WeatherWidget farmId={farm.id} /> : null}
          {farm ? <SoilCard farmId={farm.id} /> : null}
        </div>
      </div>
    </div>
  );
}
