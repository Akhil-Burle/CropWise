import { useNavigate, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from '@/components/ui/motion';
import { AlertTriangle, ArrowRight, Camera, CheckCircle2, MessageCircle, Microscope, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useLang } from '@/hooks/useLang';
import { useDemoStep } from '@/hooks/useDemoStep';
import { useDemo } from '@/store/demoStore';
import { useWizard } from '@/store/wizardStore';
import { Badge, Button, Card, CardHeader, ContentLangNotice, ErrorState, Meter, PageHeader, SkeletonCards } from '@/components/ui';
import { formatPercent } from '@/utils/format';
import { cx } from '@/utils/browser';

const SEVERITY_LEVEL = { none: 0, low: 1, moderate: 2, high: 3 };

function ConfidenceRing({ value, low }) {
  const reduce = useReducedMotion();
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className="h-36 w-36" aria-hidden="true">
      <circle cx="60" cy="60" r={r} className="fill-none stroke-surface-2" strokeWidth="12" />
      <motion.circle
        cx="60"
        cy="60"
        r={r}
        className={cx('fill-none', low ? 'stroke-warn' : 'stroke-forest')}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={reduce ? false : { strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - value) }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        transform="rotate(-90 60 60)"
      />
      <text x="60" y="66" textAnchor="middle" className="fill-ink font-display text-[26px] font-bold">
        {Math.round(value * 100)}%
      </text>
    </svg>
  );
}

function SeverityScale({ severity }) {
  const { t } = useTranslation();
  const level = SEVERITY_LEVEL[severity];
  const tones = ['bg-success', 'bg-ochre', 'bg-clay', 'bg-danger'];
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">{t('diagnosis.severity')}: {t(`diagnosis.severityLevel.${severity}`)}</p>
      <div className="flex gap-1" role="img" aria-label={`${t('diagnosis.severity')}: ${t(`diagnosis.severityLevel.${severity}`)}`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cx('h-3 flex-1 rounded-full', i <= level && level > 0 ? tones[level] : i === 0 && level === 0 ? 'bg-success' : 'bg-surface-2')} />
        ))}
      </div>
    </div>
  );
}

export default function Diagnosis() {
  const { t } = useTranslation();
  const lang = useLang();
  const { id } = useParams();
  const navigate = useNavigate();
  const advanceDemo = useDemo((s) => s.advance);
  const patchWizard = useWizard((s) => s.patch);
  const q = useServiceQuery((s) => s.analysis.get(id, lang), [id, lang]);

  const toAdvisory = () => {
    advanceDemo('diagnosis');
    navigate(`/app/analysis/${id}/advisory`);
  };
  useDemoStep('diagnosis', toAdvisory, 4200, Boolean(q.data));

  if (q.loading) return <SkeletonCards count={2} className="lg:grid-cols-2" cardClassName="h-80" />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.reload} />;
  const a = q.data;
  const d = a.diagnosis;

  const retake = () => {
    patchWizard({ farmId: a.farmId, cropId: a.cropId, growthStage: a.growthStage, area: a.area, leaf: null, step: 2 });
    navigate('/app/analysis/new');
  };

  if (!d) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader eyebrow={t('diagnosis.eyebrow')} title={t('diagnosis.failedTitle')} />
        {a.diagnosisError ? (
          <ErrorState error={a.diagnosisError}>
            <Button icon={Camera} onClick={retake}>{t('diagnosis.retake')}</Button>
            <Button variant="secondary" iconRight={ArrowRight} to={`/app/analysis/${id}/advisory`}>
              {t('diagnosis.soilOnly')}
            </Button>
          </ErrorState>
        ) : (
          <Card className="text-center">
            <p className="text-ink-muted">{t('diagnosis.noLeaf')}</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button icon={Camera} onClick={retake}>{t('diagnosis.addLeaf')}</Button>
              <Button variant="secondary" to={`/app/analysis/${id}/advisory`}>{t('diagnosis.soilOnly')}</Button>
            </div>
          </Card>
        )}
      </div>
    );
  }

  const low = d.lowConfidence;
  const alternatives = [{ name: d.name, probability: d.confidence, primary: true }, ...d.alternatives].slice(0, 3);

  return (
    <div>
      <PageHeader
        eyebrow={`${a.cropName} · ${t('diagnosis.eyebrow')}`}
        title={d.isHealthy ? t('diagnosis.healthyTitle') : d.name}
        subtitle={d.scientificName ? <em>{d.scientificName}</em> : null}
        backTo="/app/reports"
        backLabel={t('nav.reports')}
      />
      <ContentLangNotice contentLang={d.contentLang} lang={lang} className="mb-4" />

      {low ? (
        <div className="mb-6 rounded-xl border-2 border-warn bg-warn/10 p-5" role="alert">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-warn" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-lg font-semibold">{t('diagnosis.lowTitle', { pct: Math.round(d.confidenceThreshold * 100) })}</p>
              <p className="text-ink-muted">{t('diagnosis.lowText')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button icon={Camera} onClick={retake}>{t('diagnosis.retake')}</Button>
                <Button variant="secondary" icon={MessageCircle} to="/app/help">{t('diagnosis.askExpert')}</Button>
                <Button variant="ghost" icon={Phone} href="tel:18001801551">{t('diagnosis.callKcc')}</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card padded={false} className="overflow-hidden lg:col-span-2">
          {d.leafImageUrl ? (
            <img src={d.leafImageUrl} alt={t('diagnosis.leafAlt', { crop: a.cropName })} className="aspect-[3/4] w-full object-cover" />
          ) : (
            <div className="grid aspect-[3/4] place-items-center bg-surface-2 text-ink-muted">{t('diagnosis.noImage')}</div>
          )}
          <div className="flex items-center justify-between gap-2 p-4">
            <p className="text-sm text-ink-muted">{t('diagnosis.notSure')}</p>
            <Button variant="secondary" size="sm" icon={Camera} onClick={retake}>{t('diagnosis.retakeShort')}</Button>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-3">
          <Card>
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              <ConfidenceRing value={d.confidence} low={low} />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {d.isHealthy ? (
                    <Badge tone="success" icon={CheckCircle2}>{t('diagnosis.healthyBadge')}</Badge>
                  ) : (
                    <Badge tone="clay" icon={Microscope}>{t('diagnosis.detected')}</Badge>
                  )}
                  <Badge tone={low ? 'warn' : 'forest'}>{low ? t('diagnosis.confLow') : t('diagnosis.confGood')}</Badge>
                </div>
                <p className="text-sm text-ink-muted">{t('diagnosis.confidenceExplain')}</p>
                {d.severity ? <SeverityScale severity={d.severity} /> : null}
                {d.affectedAreaPct !== null && d.affectedAreaPct > 0 ? (
                  <p className="text-sm">{t('diagnosis.affected', { pct: d.affectedAreaPct })}</p>
                ) : null}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title={t('diagnosis.topMatches')} subtitle={t('diagnosis.topMatchesHint')} />
            <ol className="space-y-3">
              {alternatives.map((alt, i) => (
                <li key={alt.name}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className={cx('font-semibold', i === 0 ? 'text-ink' : 'text-ink-muted')}>
                      {i + 1}. {alt.name}
                    </span>
                    <span className="tabular">{formatPercent(alt.probability, lang)}</span>
                  </div>
                  <Meter value={alt.probability} tone={i === 0 ? (low ? 'warn' : 'forest') : 'ochre'} label={alt.name} />
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <CardHeader title={d.isHealthy ? t('diagnosis.keepWatching') : t('diagnosis.aboutDisease')} />
            <p>{d.description}</p>
            {d.symptoms.length ? (
              <>
                <h3 className="mb-2 mt-4 font-sans text-base font-semibold">{t('diagnosis.symptoms')}</h3>
                <ul className="list-disc space-y-1 pl-5">
                  {d.symptoms.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </Card>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button size="lg" iconRight={ArrowRight} onClick={toAdvisory}>
              {d.isHealthy ? t('diagnosis.seePrevention') : t('diagnosis.seeAdvisory')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
