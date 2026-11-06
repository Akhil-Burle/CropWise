import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from '@/components/ui/motion';
import { Apple, ArrowLeft, ArrowRight, Flower2, Leaf, Pencil, Send, Sprout, TestTube } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { useServices } from '@/services';
import { useServiceAction, useServiceQuery } from '@/hooks/useServiceQuery';
import { useLang } from '@/hooks/useLang';
import { useDemoStep } from '@/hooks/useDemoStep';
import { useWizard } from '@/store/wizardStore';
import { usePrefs } from '@/store/prefsStore';
import { useDemo } from '@/store/demoStore';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  NumberInput,
  PageHeader,
  SegmentedControl,
  Select,
  SkeletonCards,
  Stepper,
} from '@/components/ui';
import UploadPanel from '@/components/features/analysis/UploadPanel';
import PhotoTips from '@/components/features/analysis/PhotoTips';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { formatNumber } from '@/utils/format';

const STAGE_ICONS = { vegetative: Sprout, flowering: Flower2, fruiting: Apple };

function ScenarioPicker({ onPick }) {
  const { t } = useTranslation();
  const lang = useLang();
  const q = useServiceQuery((s) => s.demo.listScenarios(lang), [lang], { enabled: config.flags.demoMode });
  if (!config.flags.demoMode || !q.data?.length) return null;
  return (
    <Card tone="inset" className="mb-6">
      <p className="font-semibold">{t('wizard.scenarioTitle')}</p>
      <p className="mb-3 text-sm text-ink-muted">{t('wizard.scenarioHint')}</p>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {q.data.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onPick(s)}
              className="flex h-full w-full flex-col items-start gap-1 rounded-lg border border-line bg-surface p-3 text-left hover:border-clay"
            >
              <Badge tone={s.tag === 'main' ? 'forest' : 'warn'} size="sm">{t(`wizard.scenarioTag.${s.tag}`)}</Badge>
              <span className="font-semibold leading-snug">{s.title}</span>
              <span className="text-xs text-ink-muted">{s.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function NewAnalysis() {
  const { t } = useTranslation();
  const lang = useLang();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const services = useServices();
  const areaUnit = usePrefs((s) => s.areaUnit);
  const draft = useWizard();
  const { step, patch } = draft;
  const advanceDemo = useDemo((s) => s.advance);
  const toMessage = useErrorMessage();
  const [touched, setTouched] = useState(false);

  const farms = useServiceQuery((s) => s.farms.list({ pageSize: 50 }), []);
  const crops = useServiceQuery((s) => s.farms.listCrops(lang), [lang]);
  const scenarios = useServiceQuery((s) => s.demo.listScenarios(lang), [lang], { enabled: config.flags.demoMode });
  const submit = useServiceAction((s, input) => s.analysis.submit(input));

  const farmList = farms.data?.items ?? [];
  const selectedFarm = farmList.find((f) => f.id === draft.farmId);

  // Pre-select the first farm and its crop/area so the farmer has less to type.
  useEffect(() => {
    if (!draft.farmId && farmList.length) {
      const f = farmList[0];
      patch({ farmId: f.id, cropId: draft.cropId ?? f.cropIds[0] ?? null, area: draft.area ?? f.area });
    }
  }, [farmList, draft.farmId, draft.cropId, draft.area, patch]);

  const steps = useMemo(
    () => [
      { id: 'details', label: t('wizard.steps.details') },
      { id: 'soil', label: t('wizard.steps.soil') },
      { id: 'leaf', label: t('wizard.steps.leaf') },
      { id: 'review', label: t('wizard.steps.review') },
    ],
    [t],
  );

  const detailsValid = Boolean(draft.farmId && draft.cropId && draft.growthStage && draft.area && draft.area > 0);
  const canSubmit = detailsValid && Boolean(draft.soil || draft.leaf);
  const go = (n) => {
    setTouched(false);
    patch({ step: n });
  };
  const next = () => {
    if (step === 0 && !detailsValid) {
      setTouched(true);
      return;
    }
    go(Math.min(3, step + 1));
  };

  const applyScenario = async (s) => {
    const [soil, leaf] = await Promise.all([services.demo.useSample(s.soilSampleId), services.demo.useSample(s.leafSampleId)]);
    patch({ farmId: s.farmId, cropId: s.cropId, growthStage: s.growthStage, area: s.area, soil, leaf, step: 3 });
  };

  const doSubmit = async () => {
    if (!canSubmit) return;
    try {
      const { jobId } = await submit.run({
        farmId: draft.farmId,
        cropId: draft.cropId,
        growthStage: draft.growthStage,
        area: draft.area,
        areaUnit,
        soilUploadId: draft.soil?.id ?? null,
        leafUploadId: draft.leaf?.id ?? null,
      });
      advanceDemo('wizard_review');
      navigate(`/app/analysis/job/${jobId}`);
    } catch {
      /* error shown inline from submit.error */
    }
  };

  /* ---------- Run-full-demo automation ---------- */
  const main = scenarios.data?.find((s) => s.tag === 'main');
  useDemoStep(
    'wizard_details',
    () => {
      if (!main) return;
      patch({ farmId: main.farmId, cropId: main.cropId, growthStage: main.growthStage, area: main.area, step: 0 });
      setTimeout(() => {
        go(1);
        advanceDemo('wizard_details');
      }, 1600);
    },
    600,
    Boolean(main),
  );
  useDemoStep(
    'wizard_soil',
    async () => {
      if (!main) return;
      patch({ soil: await services.demo.useSample(main.soilSampleId) });
      setTimeout(() => {
        go(2);
        advanceDemo('wizard_soil');
      }, 1800);
    },
    1200,
    Boolean(main),
  );
  useDemoStep(
    'wizard_leaf',
    async () => {
      if (!main) return;
      patch({ leaf: await services.demo.useSample(main.leafSampleId) });
      setTimeout(() => {
        go(3);
        advanceDemo('wizard_leaf');
      }, 1800);
    },
    1400,
    Boolean(main),
  );
  useDemoStep('wizard_review', doSubmit, 2200, canSubmit);

  if (farms.loading || crops.loading) return <SkeletonCards count={2} cardClassName="h-48" />;
  if (farms.error) return <ErrorState error={farms.error} onRetry={farms.reload} />;
  if (farmList.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={t('wizard.eyebrow')} title={t('wizard.title')} />
      <EmptyState
        icon={Leaf}
        title={t('wizard.noFarm')}
        description={t('wizard.noFarmText')}
        action={<Button to="/app/farms">{t('farms.add')}</Button>}
      />
      </div>
    );
  }

  const cropName = crops.data?.find((c) => c.id === draft.cropId)?.name ?? '—';
  const unitWord = t(`units.${areaUnit}`, { count: draft.area ?? 0 });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={t('wizard.eyebrow')} title={t('wizard.title')} subtitle={t('wizard.subtitle')} />
      {step === 0 ? <ScenarioPicker onPick={applyScenario} /> : null}

      <div className="mb-6">
        <Stepper steps={steps} current={step} onStepClick={go} label={t('wizard.progress')} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={reduce ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
        >
          {step === 0 ? (
            <Card>
              <h2 className="mb-1 text-xl font-semibold">{t('wizard.detailsTitle')}</h2>
              <p className="mb-5 text-sm text-ink-muted">{t('wizard.detailsHint')}</p>
              <div className="space-y-5">
                <Field label={t('wizard.farm')} required>
                  <Select
                    value={draft.farmId ?? ''}
                    onChange={(e) => {
                      const f = farmList.find((x) => x.id === e.target.value);
                      patch({ farmId: e.target.value, cropId: f?.cropIds[0] ?? draft.cropId, area: f?.area ?? draft.area });
                    }}
                  >
                    {farmList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} · {f.village}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div>
                  <p className="mb-1.5 text-sm font-semibold" id="crop-label">
                    {t('wizard.crop')} <span className="text-danger" aria-hidden="true">*</span>
                  </p>
                  <SegmentedControl
                    label={t('wizard.crop')}
                    size="lg"
                    value={draft.cropId}
                    onChange={(v) => patch({ cropId: v })}
                    options={(crops.data ?? []).map((c) => ({ value: c.id, label: c.name, hint: c.scientificName }))}
                  />
                  {touched && !draft.cropId ? <p className="mt-1 text-sm text-danger" role="alert">{t('wizard.required')}</p> : null}
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-semibold">
                    {t('wizard.stage')} <span className="text-danger" aria-hidden="true">*</span>
                  </p>
                  <SegmentedControl
                    label={t('wizard.stage')}
                    size="lg"
                    value={draft.growthStage}
                    onChange={(v) => patch({ growthStage: v })}
                    options={['vegetative', 'flowering', 'fruiting'].map((s) => ({ value: s, label: t(`stage.${s}`), icon: STAGE_ICONS[s] }))}
                  />
                  {touched && !draft.growthStage ? <p className="mt-1 text-sm text-danger" role="alert">{t('wizard.required')}</p> : null}
                </div>
                <Field
                  label={t('wizard.area', { unit: unitWord })}
                  hint={selectedFarm ? t('wizard.areaHint', { area: formatNumber(selectedFarm.area, lang), unit: t(`units.${selectedFarm.areaUnit}`, { count: selectedFarm.area }) }) : undefined}
                  error={touched && !(draft.area > 0) ? t('wizard.areaError') : undefined}
                  required
                >
                  <NumberInput value={draft.area} onChange={(v) => patch({ area: v })} step={0.5} min={0.1} max={500} unit={unitWord} />
                </Field>
              </div>
            </Card>
          ) : null}

          {step === 1 ? (
            <Card>
              <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold">
                <TestTube className="h-5 w-5 text-clay" aria-hidden="true" /> {t('wizard.soilTitle')}
              </h2>
              <p className="mb-5 text-sm text-ink-muted">{t('wizard.soilHint')}</p>
              <UploadPanel kind="soil_card" value={draft.soil} onChange={(soil) => patch({ soil })} />
            </Card>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <Card>
                <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold">
                  <Leaf className="h-5 w-5 text-organic" aria-hidden="true" /> {t('wizard.leafTitle')}
                </h2>
                <p className="mb-5 text-sm text-ink-muted">{t('wizard.leafHint')}</p>
                <UploadPanel kind="leaf" value={draft.leaf} onChange={(leaf) => patch({ leaf })} />
              </Card>
              <PhotoTips />
            </div>
          ) : null}

          {step === 3 ? (
            <Card>
              <h2 className="mb-4 text-xl font-semibold">{t('wizard.reviewTitle')}</h2>
              <dl className="divide-y divide-line rounded-lg border border-line">
                {[
                  { label: t('wizard.farm'), value: selectedFarm ? `${selectedFarm.name} · ${selectedFarm.village}` : '—', step: 0 },
                  { label: t('wizard.crop'), value: cropName, step: 0 },
                  { label: t('wizard.stage'), value: draft.growthStage ? t(`stage.${draft.growthStage}`) : '—', step: 0 },
                  { label: t('wizard.areaShort'), value: draft.area ? `${formatNumber(draft.area, lang)} ${unitWord}` : '—', step: 0 },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3 px-4 py-3">
                    <dt className="w-32 shrink-0 text-sm text-ink-muted">{row.label}</dt>
                    <dd className="min-w-0 flex-1 font-semibold">{row.value}</dd>
                    <Button variant="ghost" size="sm" icon={Pencil} onClick={() => go(row.step)} label={`${t('common.edit')} ${row.label}`}>
                      <span className="sr-only sm:not-sr-only">{t('common.edit')}</span>
                    </Button>
                  </div>
                ))}
              </dl>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { ref: draft.soil, label: t('wizard.steps.soil'), step: 1 },
                  { ref: draft.leaf, label: t('wizard.steps.leaf'), step: 2 },
                ].map((u) => (
                  <div key={u.label} className="flex items-center gap-3 rounded-lg border border-line p-3">
                    {u.ref?.previewUrl ? (
                      <img src={u.ref.previewUrl} alt="" className="h-16 w-14 shrink-0 rounded object-cover" aria-hidden="true" />
                    ) : (
                      <span className="grid h-16 w-14 shrink-0 place-items-center rounded bg-surface-2 text-ink-muted" aria-hidden="true">—</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink-muted">{u.label}</p>
                      <p className="truncate font-semibold">{u.ref ? u.ref.fileName : t('wizard.skipped')}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => go(u.step)}>
                      {u.ref ? t('common.change') : t('common.add')}
                    </Button>
                  </div>
                ))}
              </div>
              {!canSubmit ? <p className="mt-4 text-sm font-medium text-danger" role="alert">{t('wizard.needUpload')}</p> : null}
              {!draft.soil && draft.leaf ? <p className="mt-4 text-sm text-ink-muted">{t('wizard.noSoilNote')}</p> : null}
              {submit.error ? <p className="mt-4 text-sm font-medium text-danger" role="alert">{toMessage(submit.error)?.title}</p> : null}
            </Card>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" icon={ArrowLeft} onClick={() => go(Math.max(0, step - 1))} disabled={step === 0}>
          {t('common.back')}
        </Button>
        <div className="flex gap-2">
          {step === 1 || step === 2 ? (
            <Button variant="ghost" onClick={() => go(step + 1)}>
              {t('wizard.skipStep')}
            </Button>
          ) : null}
          {step < 3 ? (
            <Button iconRight={ArrowRight} onClick={next}>
              {t('common.next')}
            </Button>
          ) : (
            <Button icon={Send} size="lg" onClick={doSubmit} loading={submit.loading} disabled={!canSubmit}>
              {t('wizard.submit')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
