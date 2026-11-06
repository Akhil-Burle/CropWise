import { useRef, useState } from 'react';
import { Crop, FileText, RefreshCw, RotateCw, FileImage, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { toAppError, useServices } from '@/services';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useLang } from '@/hooks/useLang';
import { Badge, Button, ErrorState, FileDropzone, Meter } from '@/components/ui';
import { cx } from '@/utils/browser';
import { readAsLocalPhoto } from '@/hooks/useOutbox';

const ACCEPT = { soil_card: 'image/jpeg,image/png,application/pdf', leaf: 'image/jpeg,image/png,image/webp' };

/**
 * Upload step body: dropzone/camera, real progress from the UploadService callback, cancel,
 * preview with rotate/crop affordances, and one-click sample data (mock data source only).
 */
export default function UploadPanel({ kind, value, onChange, hint, allowOffline = false }) {
  const { t } = useTranslation();
  const lang = useLang();
  const services = useServices();
  const [phase, setPhase] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [cropping, setCropping] = useState(false);
  const abortRef = useRef(null);
  const samples = useServiceQuery((s) => s.demo.listSamples(kind, lang), [kind, lang], { enabled: config.flags.demoMode });
  const constraints = services.uploads.constraints(kind);
  const maxMb = Math.round(constraints.maxBytes / (1024 * 1024));

  const startUpload = async (file) => {
    const invalid = services.uploads.validate(file, kind);
    if (invalid) {
      setError(invalid);
      setPhase('error');
      return;
    }
    if (allowOffline && typeof navigator !== 'undefined' && !navigator.onLine) {
      // No network: keep the photo on the phone; the outbox uploads it later.
      const local = await readAsLocalPhoto(file, kind);
      onChange({ ...local, id: `local-${Date.now()}`, previewUrl: local.dataUrl, isSample: false, sizeBytes: file.size });
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setProgress(0);
    setPhase('uploading');
    try {
      const ref = await services.uploads.upload(file, kind, { onProgress: setProgress, signal: controller.signal });
      setPhase('idle');
      setRotation(0);
      onChange(ref);
    } catch (e) {
      const err = toAppError(e);
      if (err.code === 'CANCELLED') {
        setPhase('idle');
        return;
      }
      setError(err);
      setPhase('error');
    }
  };

  const pickSample = async (sampleId) => {
    setPhase('uploading');
    setProgress(100);
    setError(null);
    try {
      onChange(await services.demo.useSample(sampleId));
      setRotation(0);
      setPhase('idle');
    } catch (e) {
      setError(toAppError(e));
      setPhase('error');
    }
  };

  const mainSample = samples.data?.[0];

  if (value) {
    const isPdf = value.mimeType === 'application/pdf';
    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">{value.fileName}</p>
            {value.isSample ? <Badge tone="ochre" size="sm">{t('upload.sampleBadge')}</Badge> : null}
          </div>
          <div className="relative grid min-h-[240px] place-items-center bg-surface-2 p-4">
            {isPdf || !value.previewUrl ? (
              <div className="flex flex-col items-center gap-2 text-ink-muted">
                <FileText className="h-12 w-12" aria-hidden="true" />
                <span className="text-sm">{t('upload.pdfPreview')}</span>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={value.previewUrl}
                  alt={kind === 'leaf' ? t('upload.leafPreviewAlt') : t('upload.cardPreviewAlt')}
                  className="max-h-[360px] w-auto rounded-md object-contain transition-transform duration-300"
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
                {cropping ? (
                  <div className="pointer-events-none absolute inset-[8%] rounded border-2 border-dashed border-ochre shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" aria-hidden="true">
                    {['-left-1.5 -top-1.5', '-right-1.5 -top-1.5', '-left-1.5 -bottom-1.5', '-right-1.5 -bottom-1.5'].map((pos) => (
                      <span key={pos} className={cx('absolute h-3 w-3 rounded-sm bg-ochre', pos)} />
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-line p-3">
            {!isPdf ? (
              <>
                <Button variant="secondary" size="sm" icon={RotateCw} onClick={() => setRotation((r) => (r + 90) % 360)}>
                  {t('upload.rotate')}
                </Button>
                <Button variant="secondary" size="sm" icon={Crop} aria-pressed={cropping} onClick={() => setCropping((c) => !c)}>
                  {cropping ? t('upload.cropDone') : t('upload.crop')}
                </Button>
              </>
            ) : null}
            <div className="flex-1" />
            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => onChange(null)}>
              {t('upload.remove')}
            </Button>
          </div>
        </div>
        {cropping ? <p className="text-sm text-ink-muted">{t('upload.cropHint')}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {phase === 'uploading' ? (
        <div className="rounded-xl border border-line bg-surface p-5" aria-live="polite">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="font-semibold">{t('upload.uploading')}</p>
            <span className="tabular text-sm text-ink-muted">{progress}%</span>
          </div>
          <Meter value={progress / 100} label={t('upload.uploading')} />
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" icon={X} onClick={() => abortRef.current?.abort()}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <FileDropzone
          accept={ACCEPT[kind]}
          onFile={startUpload}
          capture
          title={kind === 'leaf' ? t('upload.leafTitle') : t('upload.cardTitle')}
          hint={hint ?? t(kind === 'leaf' ? 'upload.leafHint' : 'upload.cardHint', { mb: maxMb })}
        />
      )}

      {phase === 'error' && error ? (
        <ErrorState error={error} compact>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => setPhase('idle')}>
            {t('upload.tryAnother')}
          </Button>
        </ErrorState>
      ) : null}

      {config.flags.demoMode && mainSample ? (
        <div className="rounded-xl border border-ochre/50 bg-ochre/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t('upload.noFile')}</p>
              <p className="text-sm text-ink-muted">{t('upload.sampleHint')}</p>
            </div>
            <Button variant="clay" icon={FileImage} onClick={() => pickSample(mainSample.id)} disabled={phase === 'uploading'} data-demo="use-sample">
              {kind === 'leaf' ? t('upload.useSampleLeaf') : t('upload.useSampleCard')}
            </Button>
          </div>
          {samples.data.length > 1 ? (
            <details className="mt-3">
              <summary className="min-h-touch cursor-pointer py-2 text-sm font-semibold text-clay">{t('upload.moreSamples')}</summary>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {samples.data.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => pickSample(s.id)}
                      className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface p-2 text-left hover:border-clay"
                    >
                      <img src={s.imageUrl} alt="" className="h-14 w-12 shrink-0 rounded object-cover" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-snug">{s.title}</span>
                        <span className="block text-xs text-ink-muted">{s.description}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
