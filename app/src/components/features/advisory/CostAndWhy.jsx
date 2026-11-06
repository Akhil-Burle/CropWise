import { CalendarClock, FlaskConical, IndianRupee, Leaf, Microscope, TestTube, Wheat } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader } from '@/components/ui';
import { useLang } from '@/hooks/useLang';
import { formatCurrency } from '@/utils/format';

function CostColumn({ title, icon: Icon, tone, breakdown, currency, unitLabel }) {
  const { t } = useTranslation();
  const lang = useLang();
  const toneCls = tone === 'chem' ? 'text-chem border-chem/30' : 'text-organic border-organic/30';
  return (
    <div className={`rounded-lg border p-4 ${toneCls}`}>
      <p className="flex items-center gap-2 font-semibold">
        <Icon className="h-5 w-5" aria-hidden="true" /> {title}
      </p>
      {breakdown ? (
        <>
          <p className="mt-1 font-display text-3xl font-bold tabular text-ink">{formatCurrency(breakdown.total, currency, lang)}</p>
          <p className="text-sm text-ink-muted">
            {formatCurrency(breakdown.perArea, currency, lang)} {unitLabel}
          </p>
          <ul className="mt-3 space-y-1 text-sm text-ink">
            {breakdown.lines.map((l) => (
              <li key={l.label} className="flex justify-between gap-3">
                <span className="text-ink-muted">{l.label}</span>
                <span className="shrink-0 tabular">{formatCurrency(l.amount, currency, lang)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-2 text-sm text-ink-muted">{t('advisory.costNone')}</p>
      )}
    </div>
  );
}

export function CostStrip({ cost, areaUnit }) {
  const { t } = useTranslation();
  const unitLabel = t(`units.per_${areaUnit}`);
  return (
    <Card className="print-avoid-break">
      <CardHeader icon={IndianRupee} title={t('advisory.costTitle')} subtitle={t('advisory.costSubtitle')} />
      <div className="grid gap-3 sm:grid-cols-2 print-grid-2">
        <CostColumn title={t('advisory.chemicalShort')} icon={FlaskConical} tone="chem" breakdown={cost.chemical} currency={cost.currency} unitLabel={unitLabel} />
        <CostColumn title={t('advisory.organicShort')} icon={Leaf} tone="organic" breakdown={cost.organic} currency={cost.currency} unitLabel={unitLabel} />
      </div>
      {cost.note ? <p className="mt-3 text-sm text-ink-muted">{cost.note}</p> : null}
    </Card>
  );
}

const SOURCE_ICON = { soil: TestTube, diagnosis: Microscope, crop: Wheat, stage: CalendarClock };

export function WhyPanel({ rationale }) {
  const { t } = useTranslation();
  return (
    <Card className="print-avoid-break">
      <CardHeader icon={Microscope} title={t('advisory.whyTitle')} subtitle={t('advisory.whySubtitle')} />
      <ol className="relative space-y-4 border-l-2 border-line pl-6">
        {rationale.map((r, i) => {
          const Icon = SOURCE_ICON[r.source];
          return (
            <li key={`${r.title}-${i}`} className="relative">
              <span className="absolute -left-[41px] grid h-8 w-8 place-items-center rounded-full border-2 border-line bg-surface text-forest" aria-hidden="true">
                <Icon className="h-4 w-4" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-clay">{t(`advisory.source.${r.source}`)}</p>
              <p className="font-semibold">{r.title}</p>
              <p className="text-sm text-ink-muted">{r.detail}</p>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
