import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Loader2, RotateCcw, ScanLine, Wand2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toAppError, useServices } from '@/services';
import { ANALYSIS_STAGES } from '@/types';
import { useAnalysisJob } from '@/hooks/useAnalysisJob';
import { useLang } from '@/hooks/useLang';
import { useDemo } from '@/store/demoStore';
import { useIsFarmer } from '@/store/authStore';
import { Button, Card, ErrorState, Meter, Skeleton } from '@/components/ui';
import { cx } from '@/utils/browser';

const STAGE_ICON = { cleaning: Wand2, reading_soil: ScanLine, analysing_leaf: ScanLine, matching_protocols: Check };

function Processing() {
  const { t } = useTranslation();
  const lang = useLang();
  const { jobId } = useParams();
  const navigate = useNavigate();
  const services = useServices();
  const advanceDemo = useDemo((s) => s.advance);
  const isFarmer = useIsFarmer();
  const { status, error, cancel, restart } = useAnalysisJob(jobId);
  const [resultError, setResultError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const handled = useRef(false);

  useEffect(() => {
    if (status?.state !== 'completed' || handled.current) return;
    handled.current = true;
    services.analysis
      .getResult(jobId, lang)
      .then((result) => {
        advanceDemo('processing');
        const skipDiagnosis = isFarmer && !useDemo.getState().running;
        const next = result.soil || result.soilError ? 'soil' : skipDiagnosis ? 'advisory' : 'diagnosis';
        setTimeout(() => navigate(`/app/analysis/${result.id}/${next}`, { replace: true }), 700);
      })
      .catch((e) => {
        handled.current = false;
        setResultError(toAppError(e));
      });
  }, [status, jobId, lang, navigate, services, advanceDemo, isFarmer]);

  const retryJob = async () => {
    setRetrying(true);
    try {
      const { jobId: newId } = await services.analysis.retry(jobId);
      handled.current = false;
      navigate(`/app/analysis/job/${newId}`, { replace: true });
    } catch (e) {
      setResultError(toAppError(e));
    } finally {
      setRetrying(false);
    }
  };

  const onCancel = async () => {
    await cancel().catch(() => undefined);
    navigate('/app/analysis/new');
  };

  const progress = status?.state === 'processing' ? status.progress : status?.state === 'completed' ? 100 : status?.state === 'queued' ? 2 : 0;
  const completed = status?.state === 'processing' ? status.completedStages : status?.state === 'completed' ? ANALYSIS_STAGES : [];
  const currentStage = status?.state === 'processing' ? status.stage : null;

  if (status?.state === 'failed' || error || resultError) {
    const err = status?.state === 'failed' ? status.error : error ?? resultError;
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-3xl font-semibold">{t('processing.failedTitle')}</h1>
        <ErrorState error={err} onRetry={err?.code === 'TIMEOUT' ? restart : retryJob}>
          <Button variant="ghost" icon={RotateCcw} to="/app/analysis/new">
            {t('processing.startAgain')}
          </Button>
        </ErrorState>
        {retrying ? <p className="text-sm text-ink-muted">{t('processing.retrying')}</p> : null}
      </div>
    );
  }

  if (status?.state === 'cancelled') {
    return (
      <Card className="mx-auto max-w-xl text-center">
        <h1 className="text-2xl font-semibold">{t('processing.cancelledTitle')}</h1>
        <p className="mt-2 text-ink-muted">{t('processing.cancelledText')}</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button onClick={retryJob} loading={retrying}>{t('processing.runAgain')}</Button>
          <Button variant="secondary" to="/app/analysis/new">{t('processing.startAgain')}</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-clay">{t('processing.eyebrow')}</p>
        <h1 className="mt-1 text-3xl font-semibold">{status?.state === 'completed' ? t('processing.doneTitle') : t('processing.title')}</h1>
        <p className="mt-2 text-ink-muted">{status?.state === 'queued' ? t('processing.queued') : t('processing.subtitle')}</p>
      </div>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold">{t('processing.overall')}</span>
          <span className="tabular text-sm text-ink-muted" aria-live="polite">{progress}%</span>
        </div>
        <Meter value={progress / 100} label={t('processing.overall')} />

        <ol className="mt-6 space-y-3" aria-live="polite">
          {ANALYSIS_STAGES.map((stage) => {
            const done = completed.includes(stage);
            const active = stage === currentStage;
            const Icon = STAGE_ICON[stage];
            return (
              <li key={stage} className={cx('flex items-center gap-4 rounded-lg border p-3 transition-colors', active ? 'border-forest bg-forest/5' : 'border-line')}>
                <span
                  className={cx(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-full',
                    done ? 'bg-forest text-on-forest' : active ? 'bg-ochre/20 text-clay' : 'bg-surface-2 text-ink-muted',
                  )}
                  aria-hidden="true"
                >
                  {done ? <Check className="h-5 w-5" /> : active ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cx('font-semibold', !done && !active && 'text-ink-muted')}>{t(`processing.stage.${stage}`)}</p>
                  <p className="text-sm text-ink-muted">{t(`processing.stageHint.${stage}`)}</p>
                </div>
                <span className="sr-only">{done ? t('processing.stateDone') : active ? t('processing.stateActive') : t('processing.statePending')}</span>
              </li>
            );
          })}
        </ol>


        {status?.state !== 'completed' ? (
          <div className="mt-6 flex justify-center">
            <Button variant="ghost" icon={X} onClick={onCancel}>
              {t('processing.cancel')}
            </Button>
          </div>
        ) : null}
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2" aria-hidden="true">
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    </div>
  );
}

/** Keyed by job id so a retry (new job) starts with fresh polling state. */
export default function ProcessingRoute() {
  const { jobId } = useParams();
  return <Processing key={jobId} />;
}
