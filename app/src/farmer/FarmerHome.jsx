import { Link } from 'react-router-dom';
import { AlertTriangle, BookOpen, CalendarCheck, Clock, CloudUpload, Leaf, Phone, ScanLine, Sprout, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useServices } from '@/services';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useLang } from '@/hooks/useLang';
import { useOutbox } from '@/hooks/useOutbox';
import { useAuthStore } from '@/store/authStore';
import { Button, Card, Skeleton } from '@/components/ui';
import ReadAloudButton from '@/components/features/common/ReadAloudButton';
import { formatDate } from '@/utils/format';
import { BigTile, ReportTranslation } from './FarmerBits';

/** Farmer home: one alert when it matters, four big buttons, nothing else to learn. */
export default function FarmerHome() {
  const { t } = useTranslation();
  const lang = useLang();
  const services = useServices();
  const user = useAuthStore((s) => s.user);
  const outbox = useOutbox();
  const phi = useServiceQuery((s) => s.treatments.getPhiAlerts(lang), [lang]);
  const todo = useServiceQuery((s) => s.treatments.list({ lang, openOnly: true, pageSize: 3, sort: 'date_asc' }), [lang]);
  const notes = useServiceQuery((s) => s.chat.listExpertNotes(), []);
  const name = user?.name.split(' ')[0] ?? '';
  const firstPhi = phi.data?.[0];
  const overdue = todo.data?.items.filter((x) => x.status === 'overdue') ?? [];
  const nextSpray = todo.data?.items[0];
  const unread = notes.data?.filter((n) => !n.read) ?? [];

  const spoken = () =>
    [
      t('farmer.home.hello', { name }),
      firstPhi ? t('farmer.home.dontHarvest', { crop: firstPhi.cropName, count: firstPhi.daysRemaining }) : '',
      overdue.length ? t('farmer.home.overdue', { count: overdue.length }) : '',
      nextSpray ? t('farmer.home.nextSpray', { title: nextSpray.title, date: formatDate(nextSpray.scheduledDate, lang, { year: undefined }) }) : '',
    ].filter(Boolean).join('. ');

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{t('farmer.home.hello', { name })}</h1>
          <p className="mt-1 text-lg text-ink-muted">{t('farmer.home.ask')}</p>
        </div>
        <ReadAloudButton getText={spoken} />
      </header>

      {outbox.items.length ? (
        <Card tone="inset" className="flex items-center gap-3">
          <CloudUpload className="h-7 w-7 shrink-0 text-info" aria-hidden="true" />
          <p className="font-semibold">{outbox.online ? t('farmer.outbox.sending', { count: outbox.items.length }) : t('farmer.outbox.waiting', { count: outbox.items.length })}</p>
        </Card>
      ) : null}

      {phi.loading ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : firstPhi ? (
        <div className="flex items-center gap-4 rounded-xl border-2 border-danger bg-danger/10 p-4" role="status" data-tour="phi-alerts">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-danger text-white dark:text-forest-deep">
            <span className="text-center leading-none">
              <span className="block font-display text-3xl font-bold tabular">{firstPhi.daysRemaining}</span>
              <span className="text-xs font-semibold">{t('dashboard.days', { count: firstPhi.daysRemaining })}</span>
            </span>
          </span>
          <div className="min-w-0">
            <p className="text-lg font-bold">{t('farmer.home.dontHarvest', { crop: firstPhi.cropName, count: firstPhi.daysRemaining })}</p>
            <p className="text-ink-muted">{t('farmer.home.safeFrom', { date: formatDate(firstPhi.safeDate, lang, { weekday: 'long', year: undefined }) })}</p>
          </div>
        </div>
      ) : null}

      {overdue.length ? (
        <Link to="/app/tracker" className="flex items-center gap-3 rounded-xl border-2 border-warn bg-warn/10 p-4 font-semibold">
          <AlertTriangle className="h-7 w-7 shrink-0 text-warn" aria-hidden="true" />
          {t('farmer.home.overdue', { count: overdue.length })}
        </Link>
      ) : null}

      {unread.map((n) => (
        <Card key={n.id} className="border-2 border-forest/40">
          <p className="flex items-center gap-2 text-sm font-semibold text-forest"><UserRound className="h-5 w-5" aria-hidden="true" />{t('farmer.home.noteFrom', { name: n.fromName })}</p>
          <p className="mt-2 text-lg">{n.text}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {n.analysisId ? <Button size="sm" variant="secondary" to={`/app/analysis/${n.analysisId}/advisory`}>{t('farmer.home.openCheck')}</Button> : null}
            <Button size="sm" variant="ghost" onClick={async () => { await services.chat.markNoteRead(n.id); notes.reload(); }}>{t('farmer.home.gotIt')}</Button>
          </div>
        </Card>
      ))}

      <nav aria-label={t('dashboard.quickActions')} data-tour="quick-actions" className="grid grid-cols-2 gap-3">
        <BigTile as={Link} to="/app/check" icon={ScanLine} tone="primary" title={t('farmer.tiles.check')} hint={t('farmer.tiles.checkHint')} />
        <BigTile as={Link} to="/app/tracker" icon={CalendarCheck} title={t('farmer.tiles.sprays')} hint={nextSpray ? formatDate(nextSpray.scheduledDate, lang, { year: undefined }) : t('farmer.tiles.spraysHint')} />
        <BigTile as={Link} to="/app/learn" icon={BookOpen} title={t('farmer.tiles.learn')} hint={t('farmer.tiles.learnHint')} />
        <BigTile as={Link} to="/app/help" icon={Phone} title={t('farmer.tiles.help')} hint={t('farmer.tiles.helpHint')} />
      </nav>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" size="lg" icon={Sprout} to="/app/transition">{t('farmer.tiles.plan')}</Button>
        <Button variant="secondary" size="lg" icon={Leaf} to="/app/reports">{t('farmer.tiles.history')}</Button>
      </div>

      <p className="flex items-center gap-2 text-sm text-ink-muted">
        <Clock className="h-4 w-4" aria-hidden="true" />
        {t('farmer.home.kvk')}
      </p>
      <ReportTranslation screen="home" />
    </div>
  );
}
