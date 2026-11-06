import { useState } from 'react';
import { AlertTriangle, Archive, Beaker, CheckCircle2, Droplets, FlaskConical, HeartPulse, Info, Lock, Recycle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Checkbox, Disclosure } from '@/components/ui';
import { useLang } from '@/hooks/useLang';
import { formatNumber, formatQuantity } from '@/utils/format';
import { cx } from '@/utils/browser';
import { PhiBadge, PpeChecklist, ToxicityBand } from './Safety';
import ReadAloudButton from '../common/ReadAloudButton';

function DoseTile({ icon: Icon, label, perArea, total, unitLabel, areaText }) {
  const lang = useLang();
  return (
    <div className="rounded-lg bg-chem-soft p-4">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-chem">
        <Icon className="h-4 w-4" aria-hidden="true" /> {label}
      </p>
      <p className="mt-1 font-display text-3xl font-bold tabular text-ink">
        {formatQuantity(perArea, lang)}
        <span className="font-sans text-base font-medium text-ink-muted">{unitLabel}</span>
      </p>
      <p className="text-sm text-ink-muted">
        {areaText}: <strong className="text-ink tabular">{formatQuantity(total, lang)}</strong>
      </p>
    </div>
  );
}

/**
 * Chemical protocol. Dosage stays hidden behind a mandatory safety acknowledgement;
 * PHI, re-entry interval, toxicity and PPE are shown first and cannot be collapsed.
 */
export default function ChemicalCard({ chemical, reason, area, areaUnit, lowConfidence, acknowledged, onAcknowledge, refreshing }) {
  const { t } = useTranslation();
  const lang = useLang();
  const [ppe, setPpe] = useState({});
  const [readConfirmed, setReadConfirmed] = useState(false);
  const unitLabel = t(`units.per_${areaUnit}`);
  const areaText = t('advisory.forYourField', { area: formatNumber(area, lang), unit: t(`units.${areaUnit}`, { count: area }) });

  const header = (
    <div className="flex items-center gap-3 border-b border-chem/20 bg-chem-soft px-5 py-4">
      <span className="grid h-11 w-11 place-items-center rounded-md bg-chem text-white dark:text-forest-deep" aria-hidden="true">
        <FlaskConical className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-chem">{t('advisory.chemicalEyebrow')}</p>
        <h2 className="text-xl font-semibold">{t('advisory.chemicalTitle')}</h2>
      </div>
    </div>
  );

  if (!chemical) {
    return (
      <section className="overflow-hidden rounded-xl border-2 border-chem/40 bg-surface print-avoid-break" aria-label={t('advisory.chemicalTitle')}>
        {header}
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
          <p className="font-display text-lg font-semibold">{t(`advisory.noChemical.${reason ?? 'no_diagnosis'}.title`)}</p>
          <p className="max-w-sm text-sm text-ink-muted">{t(`advisory.noChemical.${reason ?? 'no_diagnosis'}.text`)}</p>
        </div>
      </section>
    );
  }

  const speechText = () =>
    [
      t('advisory.chemicalTitle'),
      chemical.formulation,
      chemical.toxicity.label,
      t('advisory.phiSpoken', { count: chemical.phiDays }),
      acknowledged ? `${formatQuantity(chemical.dose.perArea, lang)} ${unitLabel}, ${formatQuantity(chemical.water.perArea, lang)} ${t('advisory.water')}` : '',
      ...chemical.warnings,
    ].join('. ');

  return (
    <section className={cx('overflow-hidden rounded-xl border-2 border-chem/40 bg-surface print-avoid-break', refreshing && 'opacity-70')} aria-label={t('advisory.chemicalTitle')} aria-busy={refreshing}>
      {header}
      <div className="space-y-5 p-5">
        <div>
          <p className="text-sm text-ink-muted">{t('advisory.product')}</p>
          <p className="font-display text-2xl font-semibold">{chemical.formulation}</p>
          <p className="text-sm text-ink-muted">
            {t('advisory.activeIngredient')}: <strong className="text-ink">{chemical.activeIngredient}</strong>
          </p>
        </div>

        <ToxicityBand toxicity={chemical.toxicity} />
        <PhiBadge days={chemical.phiDays} reentryHours={chemical.reentryHours} />

        {lowConfidence ? (
          <div className="flex gap-3 rounded-lg border-2 border-warn/60 bg-warn/10 p-3" role="alert">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warn" aria-hidden="true" />
            <p className="text-sm font-medium">{t('advisory.lowConfidenceChem')}</p>
          </div>
        ) : null}

        {!acknowledged ? (
          <div className="space-y-4 rounded-xl border-2 border-dashed border-chem/50 p-4" data-demo="safety-gate">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-chem" aria-hidden="true" />
              <div>
                <p className="font-semibold">{t('advisory.gateTitle')}</p>
                <p className="text-sm text-ink-muted">{t('advisory.gateText')}</p>
              </div>
            </div>
            <PpeChecklist items={chemical.ppe} checked={ppe} onToggle={(id) => setPpe((p) => ({ ...p, [id]: !p[id] }))} />
            <ul className="space-y-1.5 text-sm">
              {chemical.warnings.map((w) => (
                <li key={w} className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-lg bg-surface-2 p-3">
              <Checkbox checked={readConfirmed} onChange={setReadConfirmed} label={t('advisory.ackLabel')} description={t('advisory.ackHint')} tone="chem" />
            </div>
            <Button variant="chem" fullWidth icon={ShieldCheck} disabled={!readConfirmed} onClick={onAcknowledge}>
              {t('advisory.showDosage')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Badge tone="chem" icon={ShieldCheck}>
              {t('advisory.ackDone')}
            </Badge>
            <div className="grid gap-3 sm:grid-cols-2">
              <DoseTile icon={Beaker} label={t('advisory.dose')} perArea={chemical.dose.perArea} total={chemical.dose.total} unitLabel={unitLabel} areaText={areaText} />
              <DoseTile icon={Droplets} label={t('advisory.water')} perArea={chemical.water.perArea} total={chemical.water.total} unitLabel={unitLabel} areaText={areaText} />
            </div>
            {chemical.tank ? (
              <p className="rounded-lg border border-line p-3 text-sm">
                {t('advisory.tankMix', {
                  count: chemical.tank.tankCount,
                  size: chemical.tank.tankSizeL,
                  dose: formatQuantity(chemical.tank.dosePerTank, lang),
                })}
              </p>
            ) : null}
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold">{t('advisory.timing')}</dt>
                <dd className="text-ink-muted">{chemical.sprayTiming}</dd>
              </div>
              {chemical.maxApplications ? (
                <div>
                  <dt className="font-semibold">{t('advisory.maxApplications')}</dt>
                  <dd className="text-ink-muted">{t('advisory.maxApplicationsValue', { count: chemical.maxApplications, interval: chemical.intervalDays ?? '—' })}</dd>
                </div>
              ) : null}
            </dl>
            {chemical.rotationNote ? (
              <p className="flex gap-2 text-sm text-ink-muted">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {chemical.rotationNote}
              </p>
            ) : null}
          </div>
        )}

        <div className="space-y-2">
          <Disclosure summary={t('advisory.storage')} icon={Archive}>
            <ul className="list-disc space-y-1 pl-5 text-sm">{chemical.storage.map((s) => <li key={s}>{s}</li>)}</ul>
          </Disclosure>
          <Disclosure summary={t('advisory.disposal')} icon={Recycle}>
            <ul className="list-disc space-y-1 pl-5 text-sm">{chemical.disposal.map((s) => <li key={s}>{s}</li>)}</ul>
          </Disclosure>
          <Disclosure summary={t('advisory.firstAid')} icon={HeartPulse}>
            <ul className="list-disc space-y-1 pl-5 text-sm">{chemical.firstAid.map((s) => <li key={s}>{s}</li>)}</ul>
          </Disclosure>
        </div>

        <p className="rounded-lg bg-surface-2 p-3 text-sm">
          <strong>CIB&RC · </strong>
          {chemical.complianceNote}
        </p>
        <div className="no-print">
          <ReadAloudButton getText={speechText} size="sm" />
        </div>
      </div>
    </section>
  );
}
