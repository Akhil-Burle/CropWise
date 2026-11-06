import { useState } from 'react';
import { Check, Clock, FlaskConical, Leaf, ListTodo, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toAppError, useServices } from '@/services';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useLang } from '@/hooks/useLang';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { platform } from '@/platform';
import { toast } from '@/store/toastStore';
import { Button, EmptyState, ErrorState, SkeletonCards } from '@/components/ui';
import { dayKey, formatDate } from '@/utils/format';
import { cx } from '@/utils/browser';

/** "My sprays": what to do, a big Done button, and the harvest countdown. */
export default function FarmerSprays() {
  const { t } = useTranslation();
  const lang = useLang();
  const services = useServices();
  const toMessage = useErrorMessage();
  const todo = useServiceQuery((s) => s.treatments.list({ lang, openOnly: true, pageSize: 20, sort: 'date_asc' }), [lang]);
  const done = useServiceQuery((s) => s.treatments.list({ lang, status: 'done', pageSize: 6, sort: 'date_desc' }), [lang]);
  const [busy, setBusy] = useState(null);

  const markDone = async (tr) => {
    setBusy(tr.id);
    try {
      const updated = await services.treatments.markDone(tr.id, dayKey(new Date()), lang);
      toast.success(t('tracker.doneToast'), tr.phiDays ? t('tracker.doneToastPhi', { count: tr.phiDays }) : undefined);
      if (updated.harvestSafeDate && updated.daysToSafe) {
        await platform.notifications.schedule({
          id: Number(tr.id.replace(/\D/g, '').slice(-8)) || Date.now() % 1e8,
          title: t('farmer.sprays.notifyTitle'),
          body: t('farmer.sprays.notifyBody', { crop: updated.cropName ?? '' }),
          at: new Date(`${updated.harvestSafeDate}T07:00:00`),
        });
      }
      todo.reload();
      done.reload();
    } catch (e) {
      toast.error(toMessage(toAppError(e))?.title ?? '');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-semibold">{t('farmer.sprays.title')}</h1>

      <section aria-labelledby="todo-h">
        <h2 id="todo-h" className="mb-3 text-xl font-semibold">{t('farmer.sprays.todo')}</h2>
        {todo.loading ? (
          <SkeletonCards count={2} cardClassName="h-28" />
        ) : todo.error ? (
          <ErrorState error={todo.error} onRetry={todo.reload} />
        ) : todo.data.items.length === 0 ? (
          <EmptyState icon={ListTodo} title={t('tracker.emptyUpcoming')} description={t('farmer.sprays.emptyText')} action={<Button to="/app/check">{t('farmer.tiles.check')}</Button>} />
        ) : (
          <ul className="space-y-3">
            {todo.data.items.map((tr) => {
              const chem = tr.type === 'chemical';
              return (
                <li key={tr.id} className={cx('rounded-xl border-2 bg-surface p-4', tr.status === 'overdue' ? 'border-warn' : 'border-line')}>
                  <div className="flex items-start gap-3">
                    <span className={cx('grid h-12 w-12 shrink-0 place-items-center rounded-lg', chem ? 'bg-chem-soft text-chem' : 'bg-organic-soft text-organic')} aria-hidden="true">
                      {chem ? <FlaskConical className="h-6 w-6" /> : <Leaf className="h-6 w-6" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold">{tr.title}</p>
                      <p className="text-ink-muted">{tr.product}{tr.dose ? ` · ${tr.dose}` : ''}</p>
                      <p className={cx('font-semibold', tr.status === 'overdue' ? 'text-warn' : 'text-ink-muted')}>
                        {tr.status === 'overdue' ? t('farmer.sprays.late', { date: formatDate(tr.scheduledDate, lang, { year: undefined }) }) : t('farmer.sprays.on', { date: formatDate(tr.scheduledDate, lang, { weekday: 'short', year: undefined }) })}
                      </p>
                    </div>
                  </div>
                  <Button size="lg" fullWidth icon={Check} className="mt-3" loading={busy === tr.id} onClick={() => markDone(tr)}>
                    {t('farmer.sprays.done')}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="done-h">
        <h2 id="done-h" className="mb-3 text-xl font-semibold">{t('farmer.sprays.recent')}</h2>
        {done.data?.items.length ? (
          <ul className="space-y-2">
            {done.data.items.map((tr) => (
              <li key={tr.id} className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3">
                {tr.daysToSafe ? <Clock className="h-6 w-6 shrink-0 text-danger" aria-hidden="true" /> : <ShieldCheck className="h-6 w-6 shrink-0 text-success" aria-hidden="true" />}
                <div className="min-w-0">
                  <p className="font-semibold">{tr.title}</p>
                  <p className={cx('text-sm font-semibold', tr.daysToSafe ? 'text-danger' : 'text-success')}>
                    {tr.daysToSafe ? t('tracker.safeIn', { count: tr.daysToSafe, date: formatDate(tr.harvestSafeDate, lang, { year: undefined }) }) : t('farmer.sprays.safe')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : done.loading ? <SkeletonCards count={2} cardClassName="h-16" /> : <p className="text-ink-muted">{t('tracker.emptyHistoryText')}</p>}
      </section>
    </div>
  );
}
