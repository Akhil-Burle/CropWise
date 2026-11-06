import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CalendarPlus,
  Columns2,
  Download,
  FlaskConical,
  Info,
  Leaf,
  Recycle,
  Share2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { toAppError, useServices } from '@/services';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useLang } from '@/hooks/useLang';
import { useDemoStep } from '@/hooks/useDemoStep';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { useDemo } from '@/store/demoStore';
import { useIsFarmer } from '@/store/authStore';
import { useWizard } from '@/store/wizardStore';
import FarmerAnswer from '@/farmer/FarmerAnswer';
import { toast } from '@/store/toastStore';
import { Button, Card, ContentLangNotice, ErrorState, NumberInput, PageHeader, SkeletonCards, Spinner, Tabs } from '@/components/ui';
import ChemicalCard from '@/components/features/advisory/ChemicalCard';
import OrganicCard from '@/components/features/advisory/OrganicCard';
import { CostStrip, WhyPanel } from '@/components/features/advisory/CostAndWhy';
import ReadAloudButton from '@/components/features/common/ReadAloudButton';
import { dayKey, formatCurrency, formatDate, formatQuantity } from '@/utils/format';
import { cx, whatsappShareUrl } from '@/utils/browser';

function CompareSummary({ advisory }) {
  const { t } = useTranslation();
  const lang = useLang();
  const c = advisory.chemical;
  const o = advisory.organic;
  const rows = [
    { label: t('advisory.cmp.speed'), chem: c ? t('advisory.cmp.fast') : '—', org: o.effectiveness.onsetDays > 0 ? t('advisory.onset', { count: o.effectiveness.onsetDays }) : t('advisory.onsetNow') },
    { label: t('advisory.cmp.effect'), chem: c ? '100%' : '—', org: o.effectiveness.relativePct ? `${o.effectiveness.relativePct}%` : '—' },
    { label: t('advisory.phiShort'), chem: c ? t('advisory.days', { count: c.phiDays }) : '—', org: t('advisory.cmp.none') },
    { label: t('advisory.toxicityClass'), chem: c ? c.toxicity.label : '—', org: t('advisory.cmp.low') },
    {
      label: t('advisory.cmp.cost'),
      chem: advisory.cost.chemical ? formatCurrency(advisory.cost.chemical.total, advisory.cost.currency, lang) : '—',
      org: formatCurrency(advisory.cost.organic.total, advisory.cost.currency, lang),
    },
    { label: t('advisory.cmp.soil'), chem: t('advisory.cmp.soilChem'), org: t('advisory.cmp.soilOrg') },
  ];
  return (
    <Card padded={false} className="overflow-hidden">
      <table className="w-full text-sm">
        <caption className="sr-only">{t('advisory.compareCaption')}</caption>
        <thead>
          <tr>
            <th scope="col" className="w-1/3 p-3 text-left text-ink-muted"><span className="sr-only">{t('advisory.cmp.aspect')}</span></th>
            <th scope="col" className="bg-chem-soft p-3 text-left text-chem"><FlaskConical className="mb-0.5 mr-1 inline h-4 w-4" aria-hidden="true" />{t('advisory.chemicalShort')}</th>
            <th scope="col" className="bg-organic-soft p-3 text-left text-organic"><Leaf className="mb-0.5 mr-1 inline h-4 w-4" aria-hidden="true" />{t('advisory.organicShort')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row" className="p-3 text-left font-semibold">{r.label}</th>
              <td className="p-3">{r.chem}</td>
              <td className="p-3">{r.org}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export default function Advisory() {
  const { t } = useTranslation();
  const lang = useLang();
  const { id } = useParams();
  const navigate = useNavigate();
  const services = useServices();
  const toMessage = useErrorMessage();
  const advanceDemo = useDemo((s) => s.advance);
  const demoRunning = useDemo((s) => s.running);
  const isFarmer = useIsFarmer();
  const patchWizard = useWizard((s) => s.patch);

  const analysis = useServiceQuery((s) => s.analysis.get(id, lang), [id, lang]);
  const [area, setArea] = useState(null);
  const [view, setView] = useState('chemical');
  const [acknowledged, setAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    if (analysis.data && area === null) setArea(analysis.data.area);
  }, [analysis.data, area]);

  const debouncedArea = useDebouncedValue(area, config.inputDebounceMs);
  const areaUnit = analysis.data?.areaUnit ?? 'acre';
  const validArea = typeof debouncedArea === 'number' && debouncedArea > 0 && debouncedArea <= 500;
  const advisory = useServiceQuery(
    (s) => s.advisory.getAdvisory({ analysisId: id, area: debouncedArea, areaUnit, lang }),
    [id, debouncedArea, areaUnit, lang],
    { enabled: Boolean(analysis.data) && validArea },
  );
  const adv = advisory.data;

  useEffect(() => {
    if (adv) setSaved(adv.saved);
  }, [adv]);

  /* ---------- Demo: show the gate, acknowledge it, then move to the transition hub ---------- */
  useDemoStep('advisory', () => {
    setView('chemical');
    setAcknowledged(true);
    document.querySelector('[data-demo="advisory-cards"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      advanceDemo('advisory');
      navigate(`/app/transition?farm=${analysis.data?.farmId ?? ''}`);
    }, 6500);
  }, 3500, Boolean(adv));

  const onSave = async () => {
    if (!adv) return;
    setSaving(true);
    try {
      const r = await services.advisory.save(adv.id);
      setSaved(r.saved);
      toast.success(t('advisory.savedToast'));
    } catch (e) {
      toast.error(toMessage(toAppError(e))?.title ?? '');
    } finally {
      setSaving(false);
    }
  };

  const onPdf = async () => {
    if (!adv) return;
    setBusy('pdf');
    try {
      const report = await services.advisory.getAdvisoryReport(adv.id, lang);
      if (report.kind === 'url') window.open(report.url, '_blank', 'noopener');
      else {
        toast.info(t('advisory.printFallback'));
        setTimeout(() => window.print(), 300);
      }
    } catch {
      window.print();
    } finally {
      setBusy(null);
    }
  };

  const onShare = async () => {
    if (!adv) return;
    setBusy('share');
    try {
      const msg = await services.advisory.getShareMessage(adv.id, lang);
      window.open(whatsappShareUrl(msg.text), '_blank', 'noopener');
    } catch (e) {
      toast.error(toMessage(toAppError(e))?.title ?? '');
    } finally {
      setBusy(null);
    }
  };

  const onSchedule = async () => {
    if (!adv || !analysis.data) return;
    setBusy('schedule');
    try {
      const today = dayKey(new Date());
      const jobs = [];
      if (adv.chemical && acknowledged) {
        jobs.push(
          services.treatments.create(
            {
              farmId: analysis.data.farmId,
              type: 'chemical',
              title: adv.diseaseName ?? adv.cropName,
              product: adv.chemical.formulation,
              dose: `${formatQuantity(adv.chemical.dose.perArea, lang)}${t(`units.per_${areaUnit}`)}`,
              scheduledDate: today,
              phiDays: adv.chemical.phiDays,
              reminder: true,
              analysisId: adv.analysisId,
            },
            lang,
          ),
        );
      }
      const agent = adv.organic.agents[0];
      if (agent) {
        jobs.push(
          services.treatments.create(
            {
              farmId: analysis.data.farmId,
              type: 'organic',
              title: agent.name,
              product: agent.name,
              dose: `${formatQuantity(agent.dose.perArea, lang)}${t(`units.per_${areaUnit}`)}`,
              scheduledDate: today,
              phiDays: 0,
              reminder: true,
              analysisId: adv.analysisId,
            },
            lang,
          ),
        );
      }
      await Promise.all(jobs);
      toast.success(t('advisory.scheduledToast', { count: jobs.length }), t('advisory.scheduledText'));
    } catch (e) {
      toast.error(toMessage(toAppError(e))?.title ?? '');
    } finally {
      setBusy(null);
    }
  };

  if (analysis.loading) return <SkeletonCards count={2} className="lg:grid-cols-2" cardClassName="h-[28rem]" />;
  if (analysis.error) return <ErrorState error={analysis.error} onRetry={analysis.reload} />;
  const a = analysis.data;

  const summaryText = () =>
    adv
      ? [
          `${adv.cropName}${adv.diseaseName ? `, ${adv.diseaseName}` : ''}`,
          adv.chemical ? `${t('advisory.chemicalTitle')}: ${adv.chemical.formulation}. ${t('advisory.phiSpoken', { count: adv.chemical.phiDays })}` : '',
          `${t('advisory.organicTitle')}: ${adv.organic.agents.map((g) => g.name).join(', ')}`,
          adv.disclaimer,
        ].join('. ')
      : '';

  const chemicalCard = adv ? (
    <ChemicalCard
      chemical={adv.chemical}
      reason={adv.chemicalUnavailableReason}
      area={adv.area}
      areaUnit={adv.areaUnit}
      lowConfidence={adv.lowConfidence}
      acknowledged={acknowledged}
      onAcknowledge={() => setAcknowledged(true)}
      refreshing={advisory.refreshing}
    />
  ) : null;
  const organicCard = adv ? (
    <OrganicCard organic={adv.organic} area={adv.area} areaUnit={adv.areaUnit} chemicalAvailable={Boolean(adv.chemical)} refreshing={advisory.refreshing} />
  ) : null;

  const detailBlock = adv ? (
        <div className="space-y-6">
          <ContentLangNotice contentLang={adv.contentLang} lang={lang} />

          <div className="sticky top-16 z-10 -mx-4 bg-bg/95 px-4 py-2 backdrop-blur lg:hidden no-print">
            <Tabs
              label={t('advisory.viewToggle')}
              tone="compare"
              value={view}
              onChange={setView}
              tabs={[
                { id: 'chemical', label: t('advisory.chemicalShort'), icon: FlaskConical, tone: 'chem' },
                { id: 'organic', label: t('advisory.organicShort'), icon: Leaf, tone: 'organic' },
                { id: 'compare', label: t('advisory.compare'), icon: Columns2 },
              ]}
            />
          </div>

          <div data-demo="advisory-cards" className="grid gap-6 lg:grid-cols-2 print-grid-2">
            <div className={cx(view !== 'chemical' && 'hidden', 'lg:block print:block')}>{chemicalCard}</div>
            <div className={cx(view !== 'organic' && 'hidden', 'lg:block print:block')}>{organicCard}</div>
            <div className={cx(view !== 'compare' && 'hidden', 'lg:hidden print:hidden')}>
              <CompareSummary advisory={adv} />
            </div>
          </div>

          <div className="hidden lg:block">
            <CompareSummary advisory={adv} />
          </div>
          <CostStrip cost={adv.cost} areaUnit={adv.areaUnit} />
          <WhyPanel rationale={adv.rationale} />

          <Card tone="forest" className="no-print">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Recycle className="h-10 w-10 shrink-0 text-ochre" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl font-semibold">{t('advisory.nextTitle')}</p>
                <p className="text-on-forest/80 dark:text-ink-muted">{t('advisory.nextText')}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="secondary" icon={CalendarPlus} onClick={onSchedule} loading={busy === 'schedule'} disabled={demoRunning}>
                  {t('advisory.addToTracker')}
                </Button>
                <Button variant="clay" iconRight={ArrowRight} to={`/app/transition?farm=${a.farmId}`}>
                  {t('advisory.openTransition')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
  ) : null;

  if (isFarmer && !adv) {
    return (
      <div className="mx-auto max-w-2xl">
        {advisory.error ? <ErrorState error={advisory.error} onRetry={advisory.reload} /> : <SkeletonCards count={3} cardClassName="h-40" />}
      </div>
    );
  }

  if (isFarmer && adv) {
    const retake = () => {
      patchWizard({ farmId: a.farmId, cropId: a.cropId, growthStage: a.growthStage, area: a.area, leaf: null, step: 2 });
      navigate('/app/check');
    };
    return (
      <>
        <div className="no-print mx-auto mb-4 max-w-2xl">
          <label htmlFor="advisory-area" className="text-sm font-semibold">{t('advisory.areaLabel', { unit: t(`units.${areaUnit}`, { count: area ?? 0 }) })}</label>
          <NumberInput id="advisory-area" value={area} onChange={setArea} step={0.5} min={0.1} max={500} unit={t(`units.${areaUnit}`, { count: area ?? 0 })} className="mt-1" />
        </div>
        <FarmerAnswer
          analysis={a}
          advisory={adv}
          acknowledged={acknowledged}
          onAcknowledge={() => setAcknowledged(true)}
          onSchedule={onSchedule}
          onShare={onShare}
          scheduling={busy === 'schedule'}
          retake={retake}
          details={detailBlock}
        />
      </>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={`${a.farmName ?? ''} · ${formatDate(a.createdAt, lang)}`}
        title={adv ? `${adv.cropName}${adv.diseaseName ? ` · ${adv.diseaseName}` : ''}` : t('advisory.title')}
        subtitle={t('advisory.subtitle')}
        backTo={a.diagnosis || a.diagnosisError ? `/app/analysis/${id}/diagnosis` : `/app/analysis/${id}/soil`}
        actions={
          <>
            <Button variant="secondary" icon={saved ? BookmarkCheck : Bookmark} onClick={onSave} loading={saving} disabled={!adv || saved}>
              {saved ? t('advisory.saved') : t('advisory.save')}
            </Button>
            <Button variant="secondary" icon={Download} onClick={onPdf} loading={busy === 'pdf'} disabled={!adv}>
              {t('advisory.pdf')}
            </Button>
            <Button variant="secondary" icon={Share2} onClick={onShare} loading={busy === 'share'} disabled={!adv}>
              {t('advisory.whatsapp')}
            </Button>
            <ReadAloudButton getText={summaryText} />
          </>
        }
      />

      <div className="print-only mb-4 border-b border-line pb-2 text-sm">
        CropWise · {a.farmName} · {formatDate(new Date().toISOString(), lang)}
      </div>

      <div className="mb-4 flex items-start gap-3 rounded-lg border border-info/40 bg-info/5 p-4" role="note">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-info" aria-hidden="true" />
        <p className="text-sm">{adv?.disclaimer ?? t('advisory.disclaimerFallback')}</p>
      </div>

      {adv?.lowConfidence ? (
        <div className="mb-4 flex items-start gap-3 rounded-lg border-2 border-warn bg-warn/10 p-4" role="alert">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warn" aria-hidden="true" />
          <p className="font-medium">{t('advisory.lowConfidenceBanner')}</p>
        </div>
      ) : null}

      <Card className="no-print mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="advisory-area" className="text-sm font-semibold">
              {t('advisory.areaLabel', { unit: t(`units.${areaUnit}`, { count: area ?? 0 }) })}
            </label>
            <p className="text-sm text-ink-muted">{t('advisory.areaHint')}</p>
          </div>
          <NumberInput id="advisory-area" value={area} onChange={setArea} step={0.5} min={0.1} max={500} unit={t(`units.${areaUnit}`, { count: area ?? 0 })} className="sm:w-72" />
          <div className="h-6 w-28" aria-live="polite">{advisory.refreshing ? <Spinner label={t('advisory.updating')} /> : null}</div>
        </div>
        {!validArea && area !== null ? <p className="mt-2 text-sm text-danger" role="alert">{t('wizard.areaError')}</p> : null}
      </Card>

      {advisory.loading ? (
        <SkeletonCards count={2} className="lg:grid-cols-2" cardClassName="h-[32rem]" />
      ) : advisory.error ? (
        <ErrorState error={advisory.error} onRetry={advisory.reload} />
      ) : adv ? (
        detailBlock
      ) : null}
    </div>
  );
}
