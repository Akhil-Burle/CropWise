import { CalendarCheck, IndianRupee, Mountain, Sprout } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useLang } from '@/hooks/useLang';
import { Card, ErrorState, SkeletonCards } from '@/components/ui';
import FarmerPicker, { useActiveFarm } from '@/components/features/common/FarmPicker';
import ReadAloudButton from '@/components/features/common/ReadAloudButton';
import { useDemoStep } from '@/hooks/useDemoStep';
import { useDemo } from '@/store/demoStore';
import { formatCompactCurrency, formatNumber } from '@/utils/format';

/** Organic plan in plain sentences – no charts. Experts see the full hub. */
export default function FarmerPlan() {
  const { t } = useTranslation();
  const lang = useLang();
  const farms = useServiceQuery((s) => s.farms.list({ pageSize: 50 }), []);
  const { farm, setFarmId } = useActiveFarm(farms.data?.items);
  const plan = useServiceQuery((s) => s.transition.getPlan({ farmId: farm.id, speed: 'balanced', lang }), [farm?.id, lang], { enabled: Boolean(farm) });
  const p = plan.data;
  const advanceDemo = useDemo((s) => s.advance);
  useDemoStep('transition', () => advanceDemo('transition'), 6000, Boolean(p));

  if (farms.loading || plan.loading) return <SkeletonCards count={3} cardClassName="h-40" />;
  if (farms.error || plan.error) return <ErrorState error={farms.error ?? plan.error} onRetry={farms.error ? farms.reload : plan.reload} />;
  if (!p) return null;

  const last = p.roi[p.roi.length - 1];
  const socEnd = p.soc[p.soc.length - 1].value;
  const money = last.difference >= 0
    ? t('farmer.plan.moneyUp', { amount: formatCompactCurrency(last.difference, p.currency, lang) })
    : t('farmer.plan.moneyDown', { amount: formatCompactCurrency(-last.difference, p.currency, lang) });
  const soil = t('farmer.plan.soil', { from: formatNumber(p.socStart, lang, 2), to: formatNumber(socEnd, lang, 2) });
  const dip = t('farmer.plan.dip', { pct: formatNumber(p.maxYieldDipPct, lang, 0) });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-3xl font-semibold">{t('farmer.plan.title')}</h1>
        <ReadAloudButton getText={() => [money, soil, dip, ...p.thisSeason.changes].join('. ')} />
      </div>
      {farms.data.items.length > 1 ? <FarmerPicker farms={farms.data.items} value={farm.id} onChange={setFarmId} /> : null}

      <Card tone="forest">
        <ul className="space-y-3 text-lg">
          <li className="flex gap-3"><IndianRupee className="h-6 w-6 shrink-0 text-ochre" aria-hidden="true" />{money}</li>
          <li className="flex gap-3"><Mountain className="h-6 w-6 shrink-0 text-ochre" aria-hidden="true" />{soil}</li>
          <li className="flex gap-3"><Sprout className="h-6 w-6 shrink-0 text-ochre" aria-hidden="true" />{dip}</li>
        </ul>
      </Card>

      <section aria-labelledby="now-h">
        <h2 id="now-h" className="mb-2 text-2xl font-semibold">{t('farmer.plan.now')}</h2>
        <ul className="space-y-2">
          {p.thisSeason.changes.map((c) => (
            <li key={c} className="flex gap-3 rounded-lg border border-line bg-surface p-3 text-lg">
              <CalendarCheck className="mt-1 h-5 w-5 shrink-0 text-forest" aria-hidden="true" />{c}
            </li>
          ))}
        </ul>
      </section>

      <ol className="space-y-3">
        {p.years.map((y) => (
          <li key={y.year} className="rounded-xl border-2 border-line bg-surface p-4">
            <p className="text-sm font-bold uppercase tracking-wider text-clay">{t('transition.year', { n: y.year })} · {y.title}</p>
            <p className="mt-1 text-lg font-semibold">{t('farmer.plan.share', { chem: y.chemicalPct, org: y.organicPct })}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-muted">
              {y.focus.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </li>
        ))}
      </ol>
      <p className="text-sm text-ink-muted">{p.assumptions[p.assumptions.length - 1]}</p>
    </div>
  );
}
