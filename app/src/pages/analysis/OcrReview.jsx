import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Camera, CheckCircle2, Keyboard, PencilLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NUTRIENT_KEYS } from '@/types';
import { useServiceAction, useServiceQuery } from '@/hooks/useServiceQuery';
import { useLang } from '@/hooks/useLang';
import { useDemoStep } from '@/hooks/useDemoStep';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { useDemo } from '@/store/demoStore';
import { useIsFarmer } from '@/store/authStore';
import { useWizard } from '@/store/wizardStore';
import { Badge, Button, Card, ErrorState, PageHeader, SkeletonCards, TextInput } from '@/components/ui';
import SoilCardViewer from '@/components/features/soil/SoilCardViewer';
import { StatusChip, rangeText } from '@/components/features/soil/SoilBits';
import { formatDate, formatPercent } from '@/utils/format';
import { cx } from '@/utils/browser';

const UNITS = { N: 'kg/ha', P: 'kg/ha', K: 'kg/ha', pH: '', EC: 'dS/m', OC: '%' };

export default function OcrReview() {
  const { t } = useTranslation();
  const lang = useLang();
  const { id } = useParams();
  const navigate = useNavigate();
  const toMessage = useErrorMessage();
  const advanceDemo = useDemo((s) => s.advance);
  const demoRunning = useDemo((s) => s.running);
  const isFarmer = useIsFarmer();
  const patchWizard = useWizard((s) => s.patch);
  const q = useServiceQuery((s) => s.analysis.get(id, lang), [id, lang]);
  const confirm = useServiceAction((s, values) => s.analysis.confirmSoil(id, values, lang));
  const [inputs, setInputs] = useState({});
  const [activeKey, setActiveKey] = useState(null);
  const [manual, setManual] = useState(false);
  const [invalid, setInvalid] = useState([]);
  const [needOne, setNeedOne] = useState(false);

  const analysis = q.data;
  const soil = analysis?.soil;
  const original = useMemo(() => Object.fromEntries((soil?.values ?? []).map((v) => [v.key, v.value === null ? '' : String(v.value)])), [soil]);

  useEffect(() => {
    if (soil) setInputs(original);
  }, [soil, original]);

  // Nothing to review when the soil card was skipped.
  useEffect(() => {
    if (analysis && !analysis.soil && !analysis.soilError) navigate(`/app/analysis/${id}/diagnosis`, { replace: true });
  }, [analysis, id, navigate]);

  const skipDiagnosis = isFarmer && !demoRunning && Boolean(analysis?.diagnosis);
  const nextPath = (analysis?.diagnosis || analysis?.diagnosisError) && !skipDiagnosis ? 'diagnosis' : 'advisory';

  const onConfirm = async () => {
    // A box left empty means "this is not on my report"; only what is typed is sent.
    const entered = NUTRIENT_KEYS.filter((k) => (inputs[k] ?? '').trim() !== '');
    const bad = entered.filter((k) => Number.isNaN(Number(inputs[k])));
    setInvalid(bad);
    setNeedOne(entered.length === 0);
    if (bad.length || entered.length === 0) return;
    try {
      await confirm.run(entered.map((k) => ({ key: k, value: Number(inputs[k]) })));
      advanceDemo('ocr_review');
      navigate(`/app/analysis/${id}/${nextPath}`);
    } catch {
      /* field errors rendered below */
    }
  };

  useDemoStep('ocr_review', onConfirm, 3800, Boolean(soil) && Object.keys(inputs).length > 0);

  if (q.loading) return <SkeletonCards count={2} className="lg:grid-cols-2" cardClassName="h-96" />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.reload} />;
  if (!analysis) return null;

  const reviewCount = soil?.values.filter((v) => v.needsReview).length ?? 0;
  const fieldErrors = confirm.error?.fieldErrors ?? {};
  const showForm = Boolean(soil) || manual;
  const rows = soil?.values ?? NUTRIENT_KEYS.map((key) => ({ key, value: null, unit: UNITS[key], status: null, statusLabel: null, range: { low: null, high: null }, confidence: null, needsReview: true, region: null }));

  const retake = () => {
    patchWizard({ farmId: analysis.farmId, cropId: analysis.cropId, growthStage: analysis.growthStage, area: analysis.area, soil: null, step: 1 });
    navigate(isFarmer ? '/app/check' : '/app/analysis/new');
  };

  return (
    <div>
      <PageHeader
        eyebrow={t('ocr.eyebrow')}
        title={t('ocr.title')}
        subtitle={soil ? t('ocr.subtitle') : t('ocr.failedSubtitle')}
        backTo="/app/reports"
        backLabel={t('nav.reports')}
      />

      {analysis.soilError && !manual && !soil ? (
        <ErrorState error={analysis.soilError} className="mb-6">
          <Button icon={Camera} variant="secondary" onClick={retake}>
            {t('ocr.retake')}
          </Button>
          <Button icon={Keyboard} onClick={() => setManual(true)}>
            {t('ocr.enterManually')}
          </Button>
        </ErrorState>
      ) : null}

      {soil && reviewCount > 0 ? (
        <div className="mb-6 flex items-start gap-3 rounded-lg border-2 border-warn/50 bg-warn/10 p-4" role="status">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warn" aria-hidden="true" />
          <div>
            <p className="font-semibold">{t('ocr.reviewBanner', { count: reviewCount })}</p>
            <p className="text-sm text-ink-muted">{t('ocr.reviewBannerText')}</p>
          </div>
        </div>
      ) : null}
      {soil && reviewCount === 0 ? (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-success/40 bg-success/5 p-4">
          <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
          <p className="font-semibold">{t('ocr.allGood')}</p>
        </div>
      ) : null}

      {showForm ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="lg:sticky lg:top-20 lg:self-start">
            <SoilCardViewer imageUrl={soil?.cardImageUrl ?? null} values={soil?.values ?? []} activeKey={activeKey} onSelect={(k) => document.getElementById(`soil-input-${k}`)?.focus()} />
            {soil ? (
              <p className="mt-2 text-sm text-ink-muted">
                {soil.labName ?? '—'} · {t('ocr.sampleDate')}: {formatDate(soil.sampleDate, lang)}
              </p>
            ) : null}
          </div>

          <Card>
            <h2 className="mb-1 text-xl font-semibold">{t('ocr.valuesTitle')}</h2>
            <p className="mb-4 text-sm text-ink-muted">{manual && !soil ? t('ocr.manualHint') : t('ocr.valuesHint')}</p>
            <ul className="space-y-3">
              {rows.map((v) => {
                const raw = inputs[v.key] ?? '';
                const edited = soil ? raw !== original[v.key] : false;
                const err = fieldErrors[v.key] ? t('ocr.rangeError') : invalid.includes(v.key) ? t('ocr.notANumber') : null;
                const reason = soil && !edited && v.reviewReason ? t(`ocr.reason.${v.reviewReason}`) : null;
                return (
                  <li
                    key={v.key}
                    className={cx(
                      'rounded-lg border p-3 transition-colors',
                      v.needsReview && soil ? 'border-warn/60 bg-warn/5' : 'border-line',
                      activeKey === v.key && 'ring-2 ring-ochre/60',
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label htmlFor={`soil-input-${v.key}`} className="font-semibold">
                        {t(`soil.nutrient.${v.key}`)}
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {v.confidence !== null ? (
                          <Badge tone={v.needsReview ? 'warn' : 'success'} size="sm" icon={v.needsReview ? AlertTriangle : CheckCircle2}>
                            {v.needsReview ? t('ocr.checkThis') : t('ocr.confident')} · {formatPercent(v.confidence, lang)}
                          </Badge>
                        ) : null}
                        {edited ? <Badge tone="info" size="sm" icon={PencilLine}>{t('ocr.edited')}</Badge> : null}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="relative w-36 shrink-0">
                        <TextInput
                          id={`soil-input-${v.key}`}
                          inputMode="decimal"
                          value={raw}
                          onFocus={() => setActiveKey(v.key)}
                          onBlur={() => setActiveKey(null)}
                          onChange={(e) => setInputs((s) => ({ ...s, [v.key]: e.target.value.replace(',', '.') }))}
                          aria-invalid={err ? true : undefined}
                          aria-describedby={`soil-hint-${v.key}`}
                          className={cx('pr-14 text-right font-semibold tabular', v.needsReview && soil && 'border-warn')}
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-muted">{v.unit}</span>
                      </div>
                      <div className="min-w-0 flex-1 text-sm">
                        {raw.trim() === '' ? (
                          <span className="text-ink-muted">{t('ocr.leaveBlank')}</span>
                        ) : edited || !soil ? (
                          <span className="text-ink-muted">{t('ocr.recheck')}</span>
                        ) : (
                          <StatusChip status={v.status} statusLabel={v.statusLabel} size="sm" />
                        )}
                      </div>
                    </div>
                    <p id={`soil-hint-${v.key}`} className={cx('mt-1.5 text-xs', err ? 'font-medium text-danger' : 'text-ink-muted')}>
                      {err ?? reason ?? (v.range.low !== null || v.range.high !== null ? `${t('soil.normal')}: ${rangeText(t, v.range, v.unit, lang)}` : t('ocr.enterFromCard'))}
                    </p>
                  </li>
                );
              })}
            </ul>
            {needOne ? <p className="mt-3 text-sm font-medium text-danger" role="alert">{t('ocr.needOne')}</p> : null}
            {confirm.error && !confirm.error.fieldErrors ? <p className="mt-3 text-sm font-medium text-danger" role="alert">{toMessage(confirm.error)?.title}</p> : null}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              {soil ? (
                <Button variant="secondary" icon={Camera} onClick={retake}>
                  {t('ocr.retake')}
                </Button>
              ) : null}
              <Button size="lg" iconRight={ArrowRight} onClick={onConfirm} loading={confirm.loading}>
                {t('ocr.confirm')}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
