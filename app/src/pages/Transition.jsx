import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from '@/components/ui/motion';
import { CalendarCheck, FlaskConical, Gauge as GaugeIcon, Leaf, ListChecks, Mountain, Scale, Sprout, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { toAppError, useServices } from '@/services';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useLang } from '@/hooks/useLang';
import { useDemoStep } from '@/hooks/useDemoStep';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { useDemo } from '@/store/demoStore';
import { toast } from '@/store/toastStore';
import { Badge, Card, CardHeader, Checkbox, ContentLangNotice, Disclosure, EmptyState, ErrorState, PageHeader, SegmentedControl, SkeletonCards, Spinner, Stat } from '@/components/ui';
import FarmPicker, { useActiveFarm } from '@/components/features/common/FarmPicker';
import { RoiChart, SocChart, YieldChart } from '@/components/features/transition/Charts';
import { formatCurrency, formatNumber } from '@/utils/format';
import { cx } from '@/utils/browser';

const CATEGORY_TONE = { soil: 'clay', bio: 'organic', chemical: 'chem', monitoring: 'ochre', market: 'forest' };

function ShareBar({ chemicalPct, organicPct }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  return (
    <div>
      <div className="flex h-9 overflow-hidden rounded-md text-xs font-bold" role="img" aria-label={t('transition.shareAria', { chem: chemicalPct, org: organicPct })}>
        <motion.div
          className="flex items-center justify-start bg-chem px-2 text-white dark:text-forest-deep"
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${chemicalPct}%` }}
          transition={{ duration: 0.5 }}
        >
          {chemicalPct >= 12 ? `${chemicalPct}%` : ''}
        </motion.div>
        <motion.div
          className="flex flex-1 items-center justify-end bg-organic px-2 text-white dark:text-forest-deep"
          initial={false}
          animate={{ opacity: 1 }}
        >
          {organicPct >= 12 ? `${organicPct}%` : ''}
        </motion.div>
      </div>
      <div className="mt-1 flex justify-between text-xs text-ink-muted">
        <span className="flex items-center gap-1"><FlaskConical className="h-3.5 w-3.5 text-chem" aria-hidden="true" />{t('transition.chemShare', { pct: chemicalPct })}</span>
        <span className="flex items-center gap-1"><Leaf className="h-3.5 w-3.5 text-organic" aria-hidden="true" />{t('transition.orgShare', { pct: organicPct })}</span>
      </div>
    </div>
  );
}

export default function Transition() {
  const { t } = useTranslation();
  const lang = useLang();
  const services = useServices();
  const toMessage = useErrorMessage();
  const [params] = useSearchParams();
  const advanceDemo = useDemo((s) => s.advance);
  const farms = useServiceQuery((s) => s.farms.list({ pageSize: 50 }), []);
  const { farm, setFarmId } = useActiveFarm(farms.data?.items);
  const [speed, setSpeed] = useState('balanced');
  const debouncedSpeed = useDebouncedValue(speed, config.inputDebounceMs);

  useEffect(() => {
    const requested = params.get('farm');
    if (requested) setFarmId(requested);
  }, [params, setFarmId]);

  const plan = useServiceQuery(
    (s) => s.transition.getPlan({ farmId: farm.id, speed: debouncedSpeed, lang }),
    [farm?.id, debouncedSpeed, lang],
    { enabled: Boolean(farm) },
  );
  const p = plan.data;
  const changing = plan.refreshing || speed !== debouncedSpeed;

  /* Demo: show how the plan responds to transition speed, then finish. */
  useDemoStep(
    'transition',
    () => {
      const seq = ['aggressive', 'conservative', 'balanced'];
      seq.forEach((s, i) => setTimeout(() => setSpeed(s), 2600 * (i + 1)));
      setTimeout(() => advanceDemo('transition'), 2600 * (seq.length + 1));
    },
    1500,
    Boolean(p),
  );

  const toggleTask = async (taskId, done) => {
    if (!p) return;
    plan.setData((prev) => ({
      ...prev,
      seasons: prev.seasons.map((s) => ({ ...s, tasks: s.tasks.map((tk) => (tk.id === taskId ? { ...tk, done } : tk)) })),
    }));
    try {
      await services.transition.setTaskDone({ planId: p.id, taskId, done, lang });
    } catch (e) {
      plan.reload();
      toast.error(toMessage(toAppError(e))?.title ?? '');
    }
  };

  const final = useMemo(() => (p ? p.roi[p.roi.length - 1] : null), [p]);
  const socEnd = p ? p.soc[p.soc.length - 1].value : null;

  return (
    <div>
      <PageHeader eyebrow={t('transition.eyebrow')} title={t('transition.title')} subtitle={t('transition.subtitle')} />

      {farms.loading ? (
        <SkeletonCards count={3} cardClassName="h-40" />
      ) : farms.error ? (
        <ErrorState error={farms.error} onRetry={farms.reload} />
      ) : !farm ? (
        <EmptyState icon={Sprout} title={t('dashboard.noFarms')} description={t('dashboard.noFarmsText')} />
      ) : (
        <div className="space-y-6">
          <Card>
            <div className="grid gap-4 lg:grid-cols-[1fr_2fr] lg:items-end">
              <FarmPicker farms={farms.data.items} value={farm.id} onChange={setFarmId} />
              <div>
                <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
                  {t('transition.speed')}
                  {changing ? <Spinner label={t('transition.updating')} /> : null}
                </p>
                <SegmentedControl
                  label={t('transition.speed')}
                  value={speed}
                  onChange={setSpeed}
                  size="lg"
                  options={['conservative', 'balanced', 'aggressive'].map((s) => ({ value: s, label: t(`transition.speeds.${s}`), hint: t(`transition.speedHints.${s}`) }))}
                />
              </div>
            </div>
          </Card>

          {plan.loading ? (
            <SkeletonCards count={3} className="lg:grid-cols-3" cardClassName="h-56" />
          ) : plan.error ? (
            <ErrorState error={plan.error} onRetry={plan.reload} />
          ) : p ? (
            <div className={cx('space-y-6 transition-opacity', changing && 'opacity-70')} aria-busy={changing}>
              <ContentLangNotice contentLang={p.contentLang} lang={lang} />

              <Card tone="forest">
                <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-ochre">{t('transition.thisSeason')}</p>
                    <h2 className="mt-1 text-2xl font-semibold text-on-forest dark:text-ink">{p.thisSeason.title}</h2>
                    <ul className="mt-3 space-y-2">
                      {p.thisSeason.changes.map((c) => (
                        <li key={c} className="flex gap-2 text-on-forest/90 dark:text-ink">
                          <CalendarCheck className="mt-0.5 h-5 w-5 shrink-0 text-ochre" aria-hidden="true" /> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg bg-surface p-4 text-ink">
                    <ShareBar chemicalPct={p.thisSeason.chemicalPct} organicPct={p.thisSeason.organicPct} />
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <Stat label={t('transition.breakEven')} value={p.breakEven?.label ?? '—'} icon={Scale} tone="forest" className="[&_div:nth-child(2)]:text-lg" />
                      <Stat label={t('transition.maxDip')} value={`−${formatNumber(p.maxYieldDipPct, lang, 1)}%`} icon={TrendingDown} tone="clay" className="[&_div:nth-child(2)]:text-lg" />
                      <Stat label={t('transition.socEnd')} value={`${formatNumber(socEnd, lang, 2)}%`} icon={Mountain} tone="organic" className="[&_div:nth-child(2)]:text-lg" />
                    </div>
                  </div>
                </div>
              </Card>

              <section aria-labelledby="roadmap-title">
                <h2 id="roadmap-title" className="mb-3 text-2xl font-semibold">{t('transition.roadmap')}</h2>
                <ol className="grid gap-4 lg:grid-cols-3">
                  {p.years.map((y, i) => (
                    <li key={y.year} className={cx('relative rounded-xl border bg-surface p-5', i === 0 ? 'border-forest ring-2 ring-forest/20' : 'border-line')}>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="font-display text-sm font-semibold uppercase tracking-wider text-clay">{t('transition.year', { n: y.year })}</span>
                        {i === 0 ? <Badge tone="forest" size="sm">{t('transition.now')}</Badge> : null}
                      </div>
                      <h3 className="mb-3 text-xl font-semibold">{y.title}</h3>
                      <ShareBar chemicalPct={y.chemicalPct} organicPct={y.organicPct} />
                      <ul className="mt-4 space-y-1.5 text-sm">
                        {y.focus.map((f) => (
                          <li key={f} className="flex gap-2"><Sprout className="mt-0.5 h-4 w-4 shrink-0 text-organic" aria-hidden="true" />{f}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              </section>

              <div className="grid gap-6 xl:grid-cols-2">
                <Card className="xl:col-span-2">
                  <CardHeader
                    icon={TrendingUp}
                    title={t('transition.roiTitle')}
                    subtitle={t('transition.roiSubtitle')}
                    action={
                      final ? (
                        <Badge tone={final.difference >= 0 ? 'success' : 'warn'}>
                          {t('transition.roiFinal', { amount: formatCurrency(final.difference, p.currency, lang) })}
                        </Badge>
                      ) : null
                    }
                  />
                  <RoiChart data={p.roi} breakEven={p.breakEven} currency={p.currency} />
                  <p className="mt-2 text-sm text-ink-muted">
                    {p.breakEven ? t('transition.breakEvenText', { label: p.breakEven.label }) : t('transition.noBreakEven')}
                  </p>
                </Card>
                <Card>
                  <CardHeader icon={GaugeIcon} title={t('transition.yieldTitle')} subtitle={t('transition.yieldSubtitle', { dip: formatNumber(p.maxYieldDipPct, lang, 1) })} />
                  <YieldChart data={p.yieldCurve} />
                </Card>
                <Card>
                  <CardHeader
                    icon={Mountain}
                    title={t('transition.socTitle')}
                    subtitle={p.socTargetReachedLabel ? t('transition.socReached', { label: p.socTargetReachedLabel }) : t('transition.socNotReached')}
                  />
                  <SocChart data={p.soc} target={p.socTarget} reachedLabel={p.socTargetReachedLabel} />
                </Card>
              </div>

              <section aria-labelledby="checklist-title">
                <h2 id="checklist-title" className="mb-3 flex items-center gap-2 text-2xl font-semibold">
                  <ListChecks className="h-6 w-6 text-forest" aria-hidden="true" /> {t('transition.checklist')}
                </h2>
                <div className="space-y-2">
                  {p.seasons.map((s) => {
                    const done = s.tasks.filter((tk) => tk.done).length;
                    return (
                      <Disclosure
                        key={s.id}
                        defaultOpen={s.current}
                        summary={
                          <span className="flex flex-wrap items-center gap-2">
                            {s.label}
                            {s.current ? <Badge tone="forest" size="sm">{t('transition.current')}</Badge> : null}
                            <span className="text-sm font-normal text-ink-muted">{t('transition.tasksDone', { done, total: s.tasks.length })}</span>
                          </span>
                        }
                      >
                        <ul className="divide-y divide-line">
                          {s.tasks.map((tk) => (
                            <li key={tk.id} className="flex items-center justify-between gap-3">
                              <Checkbox checked={tk.done} onChange={(v) => toggleTask(tk.id, v)} label={tk.label} />
                              <Badge tone={CATEGORY_TONE[tk.category]} size="sm">{t(`transition.category.${tk.category}`)}</Badge>
                            </li>
                          ))}
                        </ul>
                      </Disclosure>
                    );
                  })}
                </div>
              </section>

              <Disclosure summary={t('transition.assumptions')}>
                <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
                  {p.assumptions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </Disclosure>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
