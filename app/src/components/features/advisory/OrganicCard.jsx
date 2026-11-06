import { Bug, Flower2, Leaf, Shovel, Sprout, Target, Tractor } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, EmptyState, Meter } from '@/components/ui';
import { useLang } from '@/hooks/useLang';
import { formatNumber, formatQuantity } from '@/utils/format';
import { cx } from '@/utils/browser';
import { StatusChip } from '../soil/SoilBits';
import RecipeViewer from './RecipeViewer';
import ReadAloudButton from '../common/ReadAloudButton';

const AGENT_TONE = { fungal: 'organic', bacterial: 'forest', botanical: 'ochre', other: 'neutral' };

function Section({ icon: Icon, title, children }) {
  return (
    <section className="print-avoid-break">
      <h3 className="mb-2 flex items-center gap-2 font-sans text-base font-semibold">
        <Icon className="h-5 w-5 text-organic" aria-hidden="true" /> {title}
      </h3>
      {children}
    </section>
  );
}

export default function OrganicCard({ organic, area, areaUnit, chemicalAvailable, refreshing }) {
  const { t } = useTranslation();
  const lang = useLang();
  const unitLabel = t(`units.per_${areaUnit}`);
  const total = t('advisory.forYourField', { area: formatNumber(area, lang), unit: t(`units.${areaUnit}`, { count: area }) });
  const eff = organic.effectiveness;

  const speechText = () =>
    [
      t('advisory.organicTitle'),
      eff.note,
      ...organic.agents.map((a) => `${a.name}: ${formatQuantity(a.dose.perArea, lang)} ${unitLabel}. ${a.method}. ${a.timing}`),
      ...organic.amendments.map((m) => `${m.product}: ${formatQuantity(m.dose.perArea, lang)} ${unitLabel}`),
      ...organic.culturalPractices,
    ].join('. ');

  return (
    <section className={cx('overflow-hidden rounded-xl border-2 border-organic/40 bg-surface print-avoid-break', refreshing && 'opacity-70')} aria-label={t('advisory.organicTitle')} aria-busy={refreshing}>
      <div className="flex items-center gap-3 border-b border-organic/20 bg-organic-soft px-5 py-4">
        <span className="grid h-11 w-11 place-items-center rounded-md bg-organic text-white dark:text-forest-deep" aria-hidden="true">
          <Leaf className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-organic">{t('advisory.organicEyebrow')}</p>
          <h2 className="text-xl font-semibold">{t('advisory.organicTitle')}</h2>
        </div>
      </div>

      <div className="space-y-6 p-5">
        {eff.relativePct > 0 ? (
          <div className="rounded-lg border border-organic/30 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">{chemicalAvailable ? t('advisory.effectivenessVsChem') : t('advisory.effectivenessPreventive')}</p>
              <p className="font-display text-2xl font-bold tabular text-organic">{eff.relativePct}%</p>
            </div>
            <Meter value={eff.relativePct / 100} tone="organic" label={t('advisory.effectivenessVsChem')} className="mt-2" />
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="organic">{eff.onsetDays > 0 ? t('advisory.onset', { count: eff.onsetDays }) : t('advisory.onsetNow')}</Badge>
              <Badge tone="neutral">{t('advisory.slowerPreventive')}</Badge>
            </div>
            <p className="mt-3 text-sm text-ink-muted">{eff.note}</p>
          </div>
        ) : (
          <p className="rounded-lg bg-surface-2 p-3 text-sm">{eff.note}</p>
        )}

        <Section icon={Sprout} title={t('advisory.bioAgents')}>
          {organic.agents.length ? (
            <ul className="space-y-3">
              {organic.agents.map((a) => (
                <li key={a.id} className="rounded-lg border border-line p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold">{a.name}</p>
                    <Badge tone={AGENT_TONE[a.type]} size="sm">{t(`advisory.agentType.${a.type}`)}</Badge>
                  </div>
                  <p className="mt-1 font-display text-xl font-semibold tabular">
                    {formatQuantity(a.dose.perArea, lang)}
                    <span className="font-sans text-sm font-medium text-ink-muted">{unitLabel}</span>
                    <span className="ml-2 font-sans text-sm font-normal text-ink-muted">
                      {total}: <strong className="text-ink">{formatQuantity(a.dose.total, lang)}</strong>
                    </span>
                  </p>
                  <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-3">
                    <div><dt className="text-xs text-ink-muted">{t('advisory.method')}</dt><dd>{a.method}</dd></div>
                    <div><dt className="text-xs text-ink-muted">{t('advisory.when')}</dt><dd>{a.timing}</dd></div>
                    <div><dt className="text-xs text-ink-muted">{t('advisory.repeat')}</dt><dd>{a.frequency}</dd></div>
                  </dl>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState compact icon={Sprout} title={t('advisory.noAgents')} description={t('advisory.noAgentsText')} />
          )}
        </Section>

        <Section icon={Shovel} title={t('advisory.amendments')}>
          {organic.amendments.length ? (
            <ul className="space-y-2">
              {organic.amendments.map((m) => (
                <li key={m.id} className="rounded-lg border border-line p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral" size="sm">{t(`soil.nutrientShort.${m.nutrient}`)}</Badge>
                    <StatusChip status={m.nutrientStatus} size="sm" />
                  </div>
                  <p className="mt-1.5 font-semibold">{m.product}</p>
                  {m.dose.perArea.value > 0 ? (
                    <p className="text-sm tabular">
                      {formatQuantity(m.dose.perArea, lang)}
                      {unitLabel} · {total}: <strong>{formatQuantity(m.dose.total, lang)}</strong>
                    </p>
                  ) : null}
                  <p className="text-sm text-ink-muted">{m.timing}. {m.note}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState compact icon={Shovel} title={t('advisory.noAmendments')} description={t('advisory.noAmendmentsText')} />
          )}
        </Section>

        {organic.recipes.length ? (
          <Section icon={Tractor} title={t('advisory.recipes')}>
            <div className="space-y-2">
              {organic.recipes.map((r) => (
                <RecipeViewer key={r.id} recipe={r} />
              ))}
            </div>
          </Section>
        ) : null}

        <div className="grid gap-6 sm:grid-cols-2">
          <Section icon={Target} title={t('advisory.traps')}>
            {organic.traps.length ? (
              <ul className="space-y-2 text-sm">
                {organic.traps.map((tp) => (
                  <li key={tp.name}>
                    <p className="font-semibold">
                      {tp.name}
                      {tp.perArea ? <span className="ml-1 font-normal text-ink-muted">· {t('advisory.trapCount', { count: tp.perArea.value })}</span> : null}
                    </p>
                    <p className="text-ink-muted">{tp.detail}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">{t('advisory.noTraps')}</p>
            )}
          </Section>
          <Section icon={Flower2} title={t('advisory.companions')}>
            {organic.companionCrops.length ? (
              <ul className="space-y-2 text-sm">
                {organic.companionCrops.map((c) => (
                  <li key={c.name}>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-ink-muted">{c.benefit}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">{t('advisory.noCompanions')}</p>
            )}
          </Section>
        </div>

        {organic.culturalPractices.length ? (
          <Section icon={Bug} title={t('advisory.cultural')}>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {organic.culturalPractices.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Section>
        ) : null}

        <div className="no-print">
          <ReadAloudButton getText={speechText} size="sm" />
        </div>
      </div>
    </section>
  );
}
