import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Apple, Flower2, Pencil, Send, Sprout, TestTube, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useServiceAction, useServiceQuery } from '@/hooks/useServiceQuery';
import { useLang } from '@/hooks/useLang';
import { useOutbox } from '@/hooks/useOutbox';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { usePrefs } from '@/store/prefsStore';
import { toast } from '@/store/toastStore';
import { Button, Card, EmptyState, ErrorState, Field, NumberInput, Select, SkeletonCards } from '@/components/ui';
import UploadPanel from '@/components/features/analysis/UploadPanel';
import { formatNumber } from '@/utils/format';
import { cx } from '@/utils/browser';

const STAGES = [
  { id: 'vegetative', icon: Sprout },
  { id: 'flowering', icon: Flower2 },
  { id: 'fruiting', icon: Apple },
];

/**
 * "Check my crop": leaf photo first, soil card optional, farm/crop/stage remembered.
 * Usually two taps from photo to answer.
 */
export default function FarmerCheck() {
  const { t } = useTranslation();
  const lang = useLang();
  const navigate = useNavigate();
  const toMessage = useErrorMessage();
  const areaUnit = usePrefs((s) => s.areaUnit);
  const lastCheck = usePrefs((s) => s.lastCheck);
  const setLastCheck = usePrefs((s) => s.setLastCheck);
  const farms = useServiceQuery((s) => s.farms.list({ pageSize: 50 }), []);
  const crops = useServiceQuery((s) => s.farms.listCrops(lang), [lang]);
  const submit = useServiceAction((s, input) => s.analysis.submit(input));
  const outbox = useOutbox();
  const [farmId, setFarmId] = useState(lastCheck?.farmId ?? null);
  const [cropId, setCropId] = useState(lastCheck?.cropId ?? null);
  const [stage, setStage] = useState(lastCheck?.growthStage ?? null);
  const [area, setArea] = useState(null);
  const [leaf, setLeaf] = useState(null);
  const [soil, setSoil] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showSoil, setShowSoil] = useState(false);

  const list = farms.data?.items ?? [];
  const farm = list.find((f) => f.id === farmId);

  useEffect(() => {
    if (!list.length) return;
    const f = list.find((x) => x.id === farmId) ?? list[0];
    if (!farmId || f.id !== farmId) setFarmId(f.id);
    if (!cropId) setCropId(f.cropIds[0] ?? null);
    if (area === null) setArea(f.area);
  }, [list, farmId, cropId, area]);

  if (farms.loading || crops.loading) return <SkeletonCards count={2} cardClassName="h-56" />;
  if (farms.error) return <ErrorState error={farms.error} onRetry={farms.reload} />;
  if (!list.length) return <EmptyState icon={Sprout} title={t('wizard.noFarm')} description={t('wizard.noFarmText')} action={<Button to="/app/farms">{t('farms.add')}</Button>} />;

  const cropName = crops.data?.find((c) => c.id === cropId)?.name ?? '—';
  const unitWord = t(`units.${areaUnit}`, { count: area ?? 0 });
  const ready = Boolean(farmId && cropId && stage && area > 0 && (leaf || soil));

  const go = async () => {
    if (!ready) return;
    setLastCheck({ farmId, cropId, growthStage: stage });
    const base = { farmId, cropId, growthStage: stage, area, areaUnit };
    const local = (r) => Boolean(r && 'dataUrl' in r);
    if (!outbox.online || local(leaf) || local(soil)) {
      outbox.enqueue({ input: base, soil, leaf });
      toast.info(t('farmer.outbox.saved'), t('farmer.outbox.savedText'));
      navigate('/app');
      return;
    }
    try {
      const { jobId } = await submit.run({ ...base, soilUploadId: soil?.id ?? null, leafUploadId: leaf?.id ?? null });
      navigate(`/app/analysis/job/${jobId}`);
    } catch {
      /* shown below */
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-3xl font-semibold">{t('farmer.check.title')}</h1>

      {!outbox.online ? (
        <p className="flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-bg"><WifiOff className="h-5 w-5" aria-hidden="true" />{t('farmer.outbox.offlineHint')}</p>
      ) : null}

      <Card>
        {!editing ? (
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink-muted">{t('farmer.check.for')}</p>
              <p className="text-lg font-bold">{cropName} · {farm?.name}</p>
              <p className="text-ink-muted">{formatNumber(area ?? 0, lang)} {unitWord}</p>
            </div>
            <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>{t('common.change')}</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label={t('wizard.farm')}>
              <Select value={farmId ?? ''} onChange={(e) => { const f = list.find((x) => x.id === e.target.value); setFarmId(e.target.value); setCropId(f?.cropIds[0] ?? cropId); setArea(f?.area ?? area); }}>
                {list.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </Select>
            </Field>
            <Field label={t('wizard.crop')}>
              <Select value={cropId ?? ''} onChange={(e) => setCropId(e.target.value)}>
                {(crops.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label={t('wizard.area', { unit: unitWord })} error={!(area > 0) ? t('wizard.areaError') : undefined}>
              <NumberInput value={area} onChange={setArea} step={0.5} min={0.1} max={500} unit={unitWord} />
            </Field>
            <Button onClick={() => setEditing(false)}>{t('common.done')}</Button>
          </div>
        )}
      </Card>

      <section aria-labelledby="stage-q">
        <h2 id="stage-q" className="mb-2 text-xl font-semibold">{t('farmer.check.stageQ')}</h2>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="stage-q">
          {STAGES.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={stage === id}
              onClick={() => setStage(id)}
              className={cx('flex min-h-[96px] flex-col items-center justify-center gap-1 rounded-xl border-2 p-2 font-bold', stage === id ? 'border-forest bg-forest/10 text-forest' : 'border-line bg-surface')}
            >
              <Icon className="h-9 w-9" aria-hidden="true" />
              {t(`stage.${id}`)}
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="leaf-q">
        <h2 id="leaf-q" className="mb-1 text-xl font-semibold">{t('farmer.check.leafQ')}</h2>
        <p className="mb-3 text-ink-muted">{t('farmer.check.leafHint')}</p>
        <UploadPanel kind="leaf" value={leaf} onChange={setLeaf} allowOffline />
      </section>

      <section>
        {!showSoil && !soil ? (
          <Button variant="secondary" size="lg" fullWidth icon={TestTube} onClick={() => setShowSoil(true)}>{t('farmer.check.addSoil')}</Button>
        ) : (
          <>
            <h2 className="mb-1 text-xl font-semibold">{t('farmer.check.soilQ')}</h2>
            <p className="mb-3 text-ink-muted">{t('farmer.check.soilHint')}</p>
            <UploadPanel kind="soil_card" value={soil} onChange={setSoil} allowOffline />
          </>
        )}
      </section>

      {submit.error ? <p className="font-semibold text-danger" role="alert">{toMessage(submit.error)?.title}</p> : null}
      {!stage ? <p className="text-ink-muted">{t('farmer.check.needStage')}</p> : !leaf && !soil ? <p className="text-ink-muted">{t('farmer.check.needPhoto')}</p> : null}
      <div className="sticky bottom-[76px] z-10 lg:bottom-4">
        <Button size="lg" fullWidth icon={Send} onClick={go} disabled={!ready} loading={submit.loading} className="shadow-pop">
          {t('farmer.check.go')}
        </Button>
      </div>
    </div>
  );
}
