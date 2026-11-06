import { useState } from 'react';
import { Flag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useServices } from '@/services';
import { useLang } from '@/hooks/useLang';
import { toast } from '@/store/toastStore';
import { Button, Modal, Textarea } from '@/components/ui';
import { formatNumber } from '@/utils/format';
import { cx } from '@/utils/browser';

const DOT = { deficient: 'bg-status-deficient', sufficient: 'bg-status-sufficient', excess: 'bg-status-excess' };

/**
 * Soil in plain words: a coloured dot and one sentence per nutrient.
 * The number is one tap away for farmers who want it.
 */
export function SimpleSoil({ report }) {
  const { t } = useTranslation();
  const lang = useLang();
  const problems = report.values.filter((v) => v.status && v.status !== 'sufficient');
  const ok = report.values.filter((v) => v.status === 'sufficient');
  return (
    <div className="space-y-2">
      {problems.length === 0 ? <p className="rounded-lg bg-success/10 p-3 font-semibold">{t('farmer.soil.allGood')}</p> : null}
      <ul className="space-y-2">
        {[...problems, ...ok].map((v) => (
          <li key={v.key}>
            <details className="group rounded-lg border border-line bg-surface">
              <summary className="flex min-h-[56px] cursor-pointer list-none items-center gap-3 px-3 py-2 [&::-webkit-details-marker]:hidden">
                <span className={cx('h-4 w-4 shrink-0 rounded-full', DOT[v.status] ?? 'bg-line')} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{t(`soil.nutrient.${v.key}`)} · {t(`soil.status.${v.status ?? 'unknown'}`)}</span>
                  <span className="block text-sm text-ink-muted">{t(`farmer.soil.${v.key}.${v.status ?? 'sufficient'}`)}</span>
                </span>
              </summary>
              <p className="border-t border-line px-3 py-2 text-sm text-ink-muted">
                {t('farmer.soil.yourValue')}: <strong className="tabular text-ink">{v.value === null ? '—' : `${formatNumber(v.value, lang)} ${v.unit}`}</strong>
              </p>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Big picture tile used across the farmer app. */
export function BigTile({ icon: Icon, title, hint, onClick, to, tone = 'default', as: As, ...rest }) {
  const cls = cx(
    'flex min-h-[112px] w-full flex-col items-start justify-between gap-2 rounded-xl border-2 p-4 text-left transition-colors',
    tone === 'primary' ? 'border-forest bg-forest text-on-forest hover:bg-forest/90' : 'border-line bg-surface hover:border-forest/60',
  );
  const body = (
    <>
      <Icon className={cx('h-9 w-9', tone === 'primary' ? 'text-ochre' : 'text-forest')} aria-hidden="true" />
      <span>
        <span className="block text-lg font-bold leading-tight">{title}</span>
        {hint ? <span className={cx('block text-sm', tone === 'primary' ? 'text-on-forest/80' : 'text-ink-muted')}>{hint}</span> : null}
      </span>
    </>
  );
  if (As) return <As to={to} className={cls} {...rest}>{body}</As>;
  return (
    <button type="button" onClick={onClick} className={cls} {...rest}>
      {body}
    </button>
  );
}

/** "Report wrong translation" – sends the screen and a note to the service. */
export function ReportTranslation({ screen }) {
  const { t } = useTranslation();
  const lang = useLang();
  const services = useServices();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  if (lang === 'en') return null;
  const send = async () => {
    setBusy(true);
    try {
      await services.chat.reportTranslation({ lang, screen, note });
      toast.success(t('farmer.report.thanks'));
      setOpen(false);
      setNote('');
    } catch {
      toast.error(t('errors.UNKNOWN.title'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button variant="ghost" size="sm" icon={Flag} onClick={() => setOpen(true)} className="no-print">
        {t('farmer.report.button')}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('farmer.report.title')}
        description={t('farmer.report.text')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={send} loading={busy} disabled={!note.trim()}>{t('farmer.report.send')}</Button>
          </>
        }
      >
        <label htmlFor="tr-note" className="sr-only">{t('farmer.report.title')}</label>
        <Textarea id="tr-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('farmer.report.placeholder')} />
      </Modal>
    </>
  );
}
