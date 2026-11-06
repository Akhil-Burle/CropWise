import { useState } from 'react';
import { AlertTriangle, Camera, CalendarPlus, CheckCircle2, Clock, FlaskConical, Leaf, Phone, Share2, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Checkbox, Disclosure } from '@/components/ui';
import { PPE_ICONS, ToxicityBand } from '@/components/features/advisory/Safety';
import RecipeViewer from '@/components/features/advisory/RecipeViewer';
import ReadAloudButton from '@/components/features/common/ReadAloudButton';
import { useLang } from '@/hooks/useLang';
import { formatCurrency, formatNumber, formatQuantity } from '@/utils/format';
import { cx } from '@/utils/browser';
import { ReportTranslation, SimpleSoil } from './FarmerBits';

function sureness(d) {
  if (!d) return null;
  if (d.lowConfidence) return 'unsure';
  return d.confidence >= 0.85 ? 'sure' : 'likely';
}

/**
 * Farmer answer screen. Order: what's wrong → what to do today (organic and chemical as two
 * equal choices) → safety → soil → actions. Everything else is in "See all details".
 */
export default function FarmerAnswer({ analysis, advisory: adv, acknowledged, onAcknowledge, onSchedule, onShare, scheduling, retake, details }) {
  const { t } = useTranslation();
  const lang = useLang();
  const [readSafety, setReadSafety] = useState(false);
  const d = analysis.diagnosis;
  const sure = sureness(d);
  const unit = t(`units.${adv.areaUnit}`, { count: adv.area });
  const fieldText = `${formatNumber(adv.area, lang)} ${unit}`;
  const c = adv.chemical;
  const o = adv.organic;

  const problem = d ? (d.isHealthy ? t('farmer.answer.healthy', { crop: adv.cropName }) : t('farmer.answer.problem', { crop: adv.cropName, disease: d.name })) : t('farmer.answer.noLeaf');

  const organicLines = o.agents.slice(0, 3).map((a) => t('farmer.answer.agentLine', { name: a.name, dose: formatQuantity(a.dose.total, lang), field: fieldText, when: a.timing }));
  const chemLine = c
    ? t('farmer.answer.chemLine', {
        dose: formatQuantity(c.dose.total, lang),
        product: c.formulation,
        water: formatQuantity(c.water.total, lang),
        field: fieldText,
      })
    : null;
  const tankLine = c?.tank ? t('farmer.answer.tankLine', { dose: formatQuantity(c.tank.dosePerTank, lang), size: c.tank.tankSizeL, count: c.tank.tankCount }) : null;

  const spoken = () =>
    [
      problem,
      sure === 'unsure' ? t('farmer.answer.unsureText') : '',
      t('farmer.answer.organicWay'),
      ...organicLines,
      c ? t('farmer.answer.chemicalWay') : '',
      c && acknowledged ? `${chemLine} ${tankLine ?? ''}` : '',
      c ? t('farmer.answer.dontHarvest', { count: c.phiDays }) : '',
      c ? t('farmer.answer.wearSpoken') : '',
    ]
      .filter(Boolean)
      .join('. ');

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* 1. What's wrong */}
      <section className="overflow-hidden rounded-xl border-2 border-line bg-surface">
        <div className="flex gap-4 p-4">
          {d?.leafImageUrl ? <img src={d.leafImageUrl} alt="" className="h-24 w-20 shrink-0 rounded-lg object-cover" aria-hidden="true" /> : null}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-snug">{problem}</h1>
            {sure ? (
              <p className={cx('mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold', sure === 'unsure' ? 'bg-warn/15 text-warn' : 'bg-success/10 text-success')}>
                {sure === 'unsure' ? <AlertTriangle className="h-4 w-4" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                {t(`farmer.answer.sure.${sure}`)}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-line p-3">
          <ReadAloudButton getText={spoken} variant="primary" />
          <Button variant="secondary" icon={Camera} onClick={retake}>{t('diagnosis.retakeShort')}</Button>
        </div>
      </section>

      {sure === 'unsure' ? (
        <div className="rounded-xl border-2 border-warn bg-warn/10 p-4" role="alert">
          <p className="text-lg font-semibold">{t('farmer.answer.unsureText')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button icon={Phone} href="tel:18001801551">{t('diagnosis.callKcc')}</Button>
            <Button variant="secondary" to="/app/help">{t('diagnosis.askExpert')}</Button>
          </div>
        </div>
      ) : null}

      <h2 className="text-2xl font-semibold">{t('farmer.answer.today')}</h2>

      {/* 2a. Organic way */}
      <section className="rounded-xl border-2 border-organic/50 bg-surface" aria-labelledby="org-way">
        <div className="flex items-center gap-3 border-b border-organic/20 bg-organic-soft px-4 py-3">
          <Leaf className="h-7 w-7 text-organic" aria-hidden="true" />
          <h3 id="org-way" className="flex-1 font-sans text-lg font-bold">{t('farmer.answer.organicWay')}</h3>
          <span className="text-sm font-semibold">{formatCurrency(adv.cost.organic.total, adv.cost.currency, lang)}</span>
        </div>
        <div className="space-y-3 p-4">
          {organicLines.length ? (
            <ol className="space-y-3">
              {organicLines.map((line, i) => (
                <li key={line} className="flex gap-3 text-lg">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-organic font-bold text-white dark:text-forest-deep">{i + 1}</span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-lg">{o.effectiveness.note}</p>
          )}
          {o.effectiveness.relativePct > 0 && c ? <p className="text-ink-muted">{t('farmer.answer.organicSlow', { days: o.effectiveness.onsetDays })}</p> : null}
          {o.recipes[0] ? <RecipeViewer recipe={o.recipes[0]} /> : null}
        </div>
      </section>

      {/* 2b. Chemical way – amount only after the safety check */}
      {c ? (
        <section className="rounded-xl border-2 border-chem/50 bg-surface" aria-labelledby="chem-way">
          <div className="flex items-center gap-3 border-b border-chem/20 bg-chem-soft px-4 py-3">
            <FlaskConical className="h-7 w-7 text-chem" aria-hidden="true" />
            <h3 id="chem-way" className="flex-1 font-sans text-lg font-bold">{t('farmer.answer.chemicalWay')}</h3>
            {adv.cost.chemical ? <span className="text-sm font-semibold">{formatCurrency(adv.cost.chemical.total, adv.cost.currency, lang)}</span> : null}
          </div>
          <div className="space-y-4 p-4">
            <ToxicityBand toxicity={c.toxicity} />
            <p className="flex items-center gap-3 rounded-lg bg-danger/10 p-3 text-lg font-bold text-danger">
              <Clock className="h-7 w-7 shrink-0" aria-hidden="true" />
              {t('farmer.answer.dontHarvest', { count: c.phiDays })}
            </p>
            <div>
              <p className="mb-2 font-semibold">{t('farmer.answer.wear')}</p>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {c.ppe.map((p) => {
                  const Icon = PPE_ICONS[p.icon];
                  return (
                    <li key={p.id} className="flex flex-col items-center gap-1 rounded-lg bg-surface-2 p-2 text-center text-xs font-medium">
                      <Icon className="h-7 w-7 text-chem" aria-hidden="true" />
                      {p.label}
                    </li>
                  );
                })}
              </ul>
            </div>
            {!acknowledged ? (
              <div className="space-y-3 rounded-lg border-2 border-dashed border-chem/50 p-3" data-demo="safety-gate">
                <Checkbox checked={readSafety} onChange={setReadSafety} tone="chem" label={t('farmer.answer.promise', { count: c.phiDays })} />
                <Button variant="chem" size="lg" fullWidth icon={ShieldCheck} disabled={!readSafety} onClick={onAcknowledge}>{t('advisory.showDosage')}</Button>
              </div>
            ) : (
              <div className="rounded-lg bg-chem-soft p-4">
                <p className="text-lg font-semibold">{chemLine}</p>
                {tankLine ? <p className="mt-1 text-ink-muted">{tankLine}</p> : null}
                <p className="mt-2 text-sm text-ink-muted">{c.sprayTiming}</p>
              </div>
            )}
            {adv.lowConfidence ? <p className="font-semibold text-warn">{t('advisory.lowConfidenceChem')}</p> : null}
          </div>
        </section>
      ) : (
        <p className="rounded-xl bg-success/10 p-4 text-lg font-semibold">{t(`advisory.noChemical.${adv.chemicalUnavailableReason ?? 'no_diagnosis'}.title`)}</p>
      )}

      {/* 3. Soil */}
      {analysis.soil ? (
        <section aria-labelledby="soil-h">
          <h2 id="soil-h" className="mb-2 text-2xl font-semibold">{t('farmer.answer.soil')}</h2>
          <SimpleSoil report={analysis.soil} />
          {o.amendments.filter((m) => m.dose.perArea.value > 0).length ? (
            <ul className="mt-3 space-y-2">
              {o.amendments.filter((m) => m.dose.perArea.value > 0).map((m) => (
                <li key={m.id} className="rounded-lg border border-line bg-surface p-3">
                  {t('farmer.answer.soilFix', { product: m.product, dose: formatQuantity(m.dose.total, lang), when: m.timing })}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {/* 4. Actions */}
      <div className="grid gap-2 sm:grid-cols-2">
        <Button size="lg" icon={CalendarPlus} onClick={onSchedule} loading={scheduling}>{t('farmer.answer.remind')}</Button>
        <Button size="lg" variant="secondary" icon={Share2} onClick={onShare}>{t('advisory.whatsapp')}</Button>
      </div>

      <p className="rounded-lg bg-surface-2 p-3 text-sm text-ink-muted">{adv.disclaimer}</p>

      <Disclosure summary={t('farmer.answer.details')}>{details}</Disclosure>
      <ReportTranslation screen="advisory" />
    </div>
  );
}
