import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FlaskConical, Leaf, MessageSquarePlus, Send, Tractor } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toAppError, useServices } from '@/services';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useLang } from '@/hooks/useLang';
import { toast } from '@/store/toastStore';
import { Badge, Button, Card, CardHeader, DataTable, EmptyState, ErrorState, Field, PageHeader, Select, SkeletonCards, Textarea } from '@/components/ui';
import { formatDate, formatDateTime, formatNumber, formatPercent } from '@/utils/format';

const STATUS_TONE = { complete: 'success', partial: 'warn', needs_review: 'info' };

export default function FarmerDetail() {
  const { t } = useTranslation();
  const lang = useLang();
  const { farmerId } = useParams();
  const [params] = useSearchParams();
  const services = useServices();
  const q = useServiceQuery((s) => s.admin.getFarmer(farmerId, lang), [farmerId, lang]);
  const [analysisId, setAnalysisId] = useState(params.get('analysis') ?? '');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  if (q.loading) return <SkeletonCards count={3} cardClassName="h-40" />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.reload} />;
  const d = q.data;

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      const note = await services.admin.sendAdvice({ farmerId, analysisId: analysisId || null, text });
      q.setData((prev) => ({ ...prev, notes: [...prev.notes, note] }));
      setText('');
      toast.success(t('expert.sent'), t('expert.sentText', { name: d.farmer.name }));
    } catch (e) {
      setError(toAppError(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader backTo="/app/admin/farmers" backLabel={t('nav.adminFarmers')} eyebrow={`${d.farmer.village}, ${d.farmer.district}`} title={d.farmer.name} subtitle={d.farmer.phone} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader icon={Tractor} title={t('nav.farms')} />
            {d.farms.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {d.farms.map((f) => (
                  <li key={f.id} className="rounded-lg border border-line p-3">
                    <p className="font-semibold">{f.name}</p>
                    <p className="text-sm text-ink-muted">{f.village} · {formatNumber(f.area, lang)} {t('units.acre', { count: f.area })} · {f.cropNames.join(', ')}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-ink-muted">—</p>}
          </Card>
          <Card>
            <CardHeader icon={Leaf} title={t('expert.analyses')} />
            <DataTable
              caption={t('expert.analyses')}
              rows={d.analyses}
              rowKey={(r) => r.id}
              empty={<EmptyState compact icon={Leaf} title={t('reports.empty')} />}
              columns={[
                { key: 'what', header: t('reports.result'), primary: true, render: (r) => <span className="font-semibold">{r.cropName} · {r.diseaseName ?? t('reports.noDiagnosis')}</span> },
                { key: 'date', header: t('reports.date'), render: (r) => formatDate(r.createdAt, lang) },
                { key: 'conf', header: t('reports.confidence'), render: (r) => (r.confidence === null ? '—' : formatPercent(r.confidence, lang)) },
                { key: 'status', header: t('reports.status'), render: (r) => <Badge tone={STATUS_TONE[r.status]} size="sm">{t(`reports.statusValue.${r.status}`)}</Badge> },
                { key: 'open', header: '', render: (r) => <Button size="sm" variant="secondary" to={`/app/analysis/${r.id}/diagnosis`}>{t('reports.open')}</Button> },
              ]}
            />
          </Card>
          <Card>
            <CardHeader icon={FlaskConical} title={t('expert.treatments')} />
            {d.treatments.length ? (
              <ul className="divide-y divide-line text-sm">
                {d.treatments.map((tr) => (
                  <li key={tr.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span><strong>{tr.title}</strong> · {tr.product}</span>
                    <span className="flex gap-2">
                      <Badge tone={tr.type === 'chemical' ? 'chem' : 'organic'} size="sm">{t(`tracker.type.${tr.type}`)}</Badge>
                      <Badge size="sm">{t(`tracker.status.${tr.status}`)}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-ink-muted">{t('tracker.emptyHistory')}</p>}
          </Card>
        </div>

        <Card className="h-fit xl:sticky xl:top-20">
          <CardHeader icon={MessageSquarePlus} title={t('expert.sendTitle')} subtitle={t('expert.sendHint')} />
          <div className="space-y-3">
            <Field label={t('expert.about')}>
              <Select value={analysisId} onChange={(e) => setAnalysisId(e.target.value)}>
                <option value="">{t('expert.general')}</option>
                {d.analyses.map((a) => <option key={a.id} value={a.id}>{a.cropName} · {a.diseaseName ?? t('reports.noDiagnosis')} · {formatDate(a.createdAt, lang)}</option>)}
              </Select>
            </Field>
            <Field label={t('expert.message')} error={error?.fieldErrors?.text ? t('wizard.required') : undefined}>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t('expert.placeholder')} />
            </Field>
            <Button fullWidth icon={Send} onClick={send} loading={sending} disabled={!text.trim()}>{t('expert.send')}</Button>
          </div>
          {d.notes.length ? (
            <ul className="mt-5 space-y-2 border-t border-line pt-4">
              {[...d.notes].reverse().map((n) => (
                <li key={n.id} className="rounded-lg bg-surface-2 p-3 text-sm">
                  <p className="text-xs text-ink-muted">{n.fromName} · {formatDateTime(n.createdAt, lang)} · {n.read ? t('expert.read') : t('expert.unread')}</p>
                  <p>{n.text}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
