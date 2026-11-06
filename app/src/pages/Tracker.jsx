import { useState } from 'react';
import { AlertTriangle, Bell, BellOff, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, FlaskConical, History, Leaf, ListTodo, Plus, ShieldCheck, SkipForward } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { toAppError, useServices } from '@/services';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useLang } from '@/hooks/useLang';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { toast } from '@/store/toastStore';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Field,
  NumberInput,
  PageHeader,
  Pagination,
  SegmentedControl,
  Select,
  SkeletonCards,
  Switch,
  Tabs,
  TextInput,
  Modal,
  tabPanelProps,
} from '@/components/ui';
import { dayKey, formatDate, locale } from '@/utils/format';
import { cx } from '@/utils/browser';

const STATUS_TONE = { scheduled: 'info', done: 'success', overdue: 'danger', skipped: 'neutral' };

function TreatmentItem({ tr, onChange }) {
  const { t } = useTranslation();
  const lang = useLang();
  const services = useServices();
  const toMessage = useErrorMessage();
  const [busy, setBusy] = useState(null);
  const act = async (kind, fn) => {
    setBusy(kind);
    try {
      onChange(await fn());
      if (kind === 'done') toast.success(t('tracker.doneToast'), tr.phiDays ? t('tracker.doneToastPhi', { count: tr.phiDays }) : undefined);
    } catch (e) {
      toast.error(toMessage(toAppError(e))?.title ?? '');
    } finally {
      setBusy(null);
    }
  };
  const chem = tr.type === 'chemical';
  return (
    <li className={cx('rounded-lg border bg-surface p-4', tr.status === 'overdue' ? 'border-danger/50' : 'border-line')}>
      <div className="flex items-start gap-3">
        <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-md', chem ? 'bg-chem-soft text-chem' : 'bg-organic-soft text-organic')} aria-hidden="true">
          {chem ? <FlaskConical className="h-5 w-5" /> : <Leaf className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{tr.title}</p>
            <Badge tone={chem ? 'chem' : 'organic'} size="sm">{t(`tracker.type.${tr.type}`)}</Badge>
            <Badge tone={STATUS_TONE[tr.status]} size="sm" icon={tr.status === 'overdue' ? AlertTriangle : undefined}>{t(`tracker.status.${tr.status}`)}</Badge>
          </div>
          <p className="text-sm text-ink-muted">
            {tr.product}
            {tr.dose ? ` · ${tr.dose}` : ''}
          </p>
          <p className="text-sm text-ink-muted">
            {tr.farmName} · {tr.doneDate ? t('tracker.doneOn', { date: formatDate(tr.doneDate, lang) }) : t('tracker.planned', { date: formatDate(tr.scheduledDate, lang) })}
          </p>
          {tr.harvestSafeDate ? (
            <p className={cx('mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold', tr.daysToSafe > 0 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success')}>
              {tr.daysToSafe > 0 ? <Clock className="h-4 w-4" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
              {tr.daysToSafe > 0
                ? t('tracker.safeIn', { count: tr.daysToSafe, date: formatDate(tr.harvestSafeDate, lang) })
                : t('tracker.safeNow', { date: formatDate(tr.harvestSafeDate, lang) })}
            </p>
          ) : tr.phiDays && tr.status !== 'done' ? (
            <p className="mt-2 text-sm text-ink-muted">{t('tracker.phiPending', { count: tr.phiDays })}</p>
          ) : null}
        </div>
      </div>
      {tr.status === 'scheduled' || tr.status === 'overdue' ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" icon={Check} loading={busy === 'done'} onClick={() => act('done', () => services.treatments.markDone(tr.id, dayKey(new Date()), lang))}>
            {t('tracker.markDone')}
          </Button>
          <Button size="sm" variant="secondary" icon={SkipForward} loading={busy === 'skip'} onClick={() => act('skip', () => services.treatments.skip(tr.id, lang))}>
            {t('tracker.skip')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={tr.reminder ? Bell : BellOff}
            aria-pressed={tr.reminder}
            loading={busy === 'rem'}
            onClick={() => act('rem', () => services.treatments.setReminder(tr.id, !tr.reminder, lang))}
          >
            {tr.reminder ? t('tracker.reminderOn') : t('tracker.reminderOff')}
          </Button>
        </div>
      ) : null}
    </li>
  );
}

function TreatmentList({ query, onItemChange, emptyTitle, emptyText, onPage }) {
  if (query.loading) return <SkeletonCards count={3} cardClassName="h-32" />;
  if (query.error) return <ErrorState error={query.error} onRetry={query.reload} />;
  const page = query.data;
  if (page.items.length === 0) return <EmptyState icon={ListTodo} title={emptyTitle} description={emptyText} />;
  return (
    <>
      <ul className="space-y-3">
        {page.items.map((tr) => (
          <TreatmentItem key={tr.id} tr={tr} onChange={onItemChange} />
        ))}
      </ul>
      <Pagination page={page.page} hasMore={page.hasMore} total={page.total} pageSize={page.pageSize} onPage={onPage} />
    </>
  );
}

function MonthCalendar({ month, setMonth, items, selected, onSelect }) {
  const { t } = useTranslation();
  const lang = useLang();
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((startOffset + daysInMonth) / 7) * 7 }, (_, i) => {
    const d = i - startOffset + 1;
    return d >= 1 && d <= daysInMonth ? new Date(month.getFullYear(), month.getMonth(), d) : null;
  });
  const byDay = items.reduce((acc, tr) => {
    const k = tr.doneDate ?? tr.scheduledDate;
    (acc[k] ??= []).push(tr);
    return acc;
  }, {});
  const weekdays = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale(lang), { weekday: 'narrow' }).format(new Date(2024, 0, 1 + i)));
  const today = dayKey(new Date());
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" iconOnly icon={ChevronLeft} label={t('tracker.prevMonth')} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} />
        <p className="font-display text-lg font-semibold" aria-live="polite">
          {new Intl.DateTimeFormat(locale(lang), { month: 'long', year: 'numeric' }).format(month)}
        </p>
        <Button variant="ghost" iconOnly icon={ChevronRight} label={t('tracker.nextMonth')} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} />
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink-muted" aria-hidden="true">
        {weekdays.map((w, i) => <div key={`${w}-${i}`} className="py-1">{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label={t('tracker.calendar')}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />;
          const k = dayKey(d);
          const list = byDay[k] ?? [];
          return (
            <button
              key={k}
              type="button"
              onClick={() => onSelect(k)}
              aria-pressed={selected === k}
              aria-label={`${formatDate(k, lang)}: ${t('tracker.itemsCount', { count: list.length })}`}
              className={cx(
                'flex min-h-[52px] flex-col items-center justify-start gap-1 rounded-md border py-1.5 text-sm tabular',
                selected === k ? 'border-forest bg-forest/10' : 'border-transparent hover:bg-surface-2',
                k === today && 'font-bold text-clay',
              )}
            >
              {d.getDate()}
              <span className="flex gap-0.5" aria-hidden="true">
                {list.slice(0, 3).map((tr) => (
                  <span key={tr.id} className={cx('h-1.5 w-1.5 rounded-full', tr.type === 'chemical' ? 'bg-chem' : 'bg-organic', tr.status === 'overdue' && 'ring-2 ring-danger')} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-ink-muted">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-chem" aria-hidden="true" />{t('tracker.type.chemical')}</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-organic" aria-hidden="true" />{t('tracker.type.organic')}</span>
      </div>
    </div>
  );
}

function HarvestCalculator() {
  const { t } = useTranslation();
  const lang = useLang();
  const [date, setDate] = useState(dayKey(new Date()));
  const [phi, setPhi] = useState(7);
  const debounced = useDebouncedValue({ date, phi }, config.inputDebounceMs);
  const valid = Boolean(debounced.date) && typeof debounced.phi === 'number' && debounced.phi >= 0;
  const q = useServiceQuery((s) => s.treatments.calculateHarvestSafe({ applicationDate: debounced.date, phiDays: debounced.phi }), [debounced.date, debounced.phi], { enabled: valid });
  return (
    <Card>
      <CardHeader icon={ShieldCheck} title={t('tracker.calcTitle')} subtitle={t('tracker.calcSubtitle')} />
      <div className="grid gap-4">
        <Field label={t('tracker.sprayDate')}>
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={t('tracker.phiDays')}>
          <NumberInput value={phi} onChange={setPhi} min={0} max={180} step={1} decimals={0} unit={t('tracker.daysUnit')} />
        </Field>
      </div>
      <div className="mt-4 min-h-[76px] rounded-lg bg-surface-2 p-4" aria-live="polite">
        {q.error ? (
          <p className="text-sm text-danger">{t('tracker.calcError')}</p>
        ) : q.data ? (
          <>
            <p className="text-sm text-ink-muted">{t('tracker.safeFrom')}</p>
            <p className="font-display text-2xl font-semibold">{formatDate(q.data.safeDate, lang, { weekday: 'short' })}</p>
            <p className={cx('text-sm font-semibold', q.data.isSafeToday ? 'text-success' : 'text-danger')}>
              {q.data.isSafeToday ? t('tracker.calcSafeToday') : t('tracker.calcDaysLeft', { count: q.data.daysRemaining })}
            </p>
          </>
        ) : (
          <SkeletonCards count={1} cardClassName="h-10" />
        )}
      </div>
    </Card>
  );
}

function AddTreatment({ open, onClose, farms, onCreated }) {
  const { t } = useTranslation();
  const lang = useLang();
  const services = useServices();
  const toMessage = useErrorMessage();
  const [form, setForm] = useState({ farmId: farms[0]?.id ?? '', type: 'organic', title: '', product: '', dose: '', scheduledDate: dayKey(new Date()), phiDays: 0, reminder: true });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (p) => setForm((f) => ({ ...f, ...p }));
  const fe = error?.fieldErrors ?? {};
  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await services.treatments.create({ ...form, dose: form.dose || null, phiDays: form.phiDays ?? null, analysisId: null }, lang);
      toast.success(t('tracker.addedToast'));
      onCreated();
      onClose();
    } catch (e) {
      setError(toAppError(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('tracker.addTitle')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={submit} loading={saving}>{t('common.save')}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t('wizard.farm')}>
          <Select value={form.farmId} onChange={(e) => set({ farmId: e.target.value })}>
            {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Select>
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-semibold">{t('tracker.typeLabel')}</p>
          <SegmentedControl label={t('tracker.typeLabel')} value={form.type} onChange={(v) => set({ type: v, phiDays: v === 'organic' ? 0 : 7 })} options={[{ value: 'organic', label: t('tracker.type.organic'), icon: Leaf }, { value: 'chemical', label: t('tracker.type.chemical'), icon: FlaskConical }]} />
        </div>
        <Field label={t('tracker.titleLabel')} error={fe.title ? t('wizard.required') : undefined} required>
          <TextInput value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder={t('tracker.titlePlaceholder')} />
        </Field>
        <Field label={t('tracker.productLabel')} error={fe.product ? t('wizard.required') : undefined} required>
          <TextInput value={form.product} onChange={(e) => set({ product: e.target.value })} />
        </Field>
        <Field label={t('tracker.doseLabel')}>
          <TextInput value={form.dose} onChange={(e) => set({ dose: e.target.value })} placeholder="200 L/acre" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('tracker.dateLabel')} error={fe.scheduledDate ? t('wizard.required') : undefined}>
            <TextInput type="date" value={form.scheduledDate} onChange={(e) => set({ scheduledDate: e.target.value })} />
          </Field>
          <Field label={t('tracker.phiDays')} error={fe.phiDays ? t('tracker.phiRange') : undefined}>
            <NumberInput value={form.phiDays} onChange={(v) => set({ phiDays: v })} min={0} max={180} decimals={0} unit={t('tracker.daysUnit')} />
          </Field>
        </div>
        <Switch checked={form.reminder} onChange={(v) => set({ reminder: v })} label={t('tracker.reminderLabel')} description={t('tracker.reminderHint')} />
        {error && !error.fieldErrors ? <p className="text-sm text-danger" role="alert">{toMessage(error)?.title}</p> : null}
      </div>
    </Modal>
  );
}

export default function Tracker() {
  const { t } = useTranslation();
  const lang = useLang();
  const [tab, setTab] = useState('upcoming');
  const [farmId, setFarmId] = useState('');
  const [type, setType] = useState('');
  const [upPage, setUpPage] = useState(1);
  const [histPage, setHistPage] = useState(1);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(dayKey(new Date()));
  const [adding, setAdding] = useState(false);
  const farms = useServiceQuery((s) => s.farms.list({ pageSize: 50 }), []);
  const filters = { lang, farmId: farmId || undefined, type: type || undefined };
  const upcoming = useServiceQuery((s) => s.treatments.list({ ...filters, openOnly: true, page: upPage, pageSize: 6, sort: 'date_asc' }), [lang, farmId, type, upPage]);
  const history = useServiceQuery((s) => s.treatments.list({ ...filters, status: 'done', page: histPage, pageSize: 6, sort: 'date_desc' }), [lang, farmId, type, histPage]);
  const monthFrom = dayKey(month);
  const monthTo = dayKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  const calendar = useServiceQuery((s) => s.treatments.list({ ...filters, from: monthFrom, to: monthTo, pageSize: 100 }), [lang, farmId, type, monthFrom, monthTo]);

  const refreshAll = () => {
    upcoming.reload();
    history.reload();
    calendar.reload();
  };
  const onItemChange = () => refreshAll();
  const dayItems = (calendar.data?.items ?? []).filter((x) => (x.doneDate ?? x.scheduledDate) === selectedDay);
  const base = 'tracker';

  return (
    <div>
      <PageHeader
        eyebrow={t('tracker.eyebrow')}
        title={t('tracker.title')}
        subtitle={t('tracker.subtitle')}
        actions={<Button icon={Plus} onClick={() => setAdding(true)} disabled={!farms.data?.items.length}>{t('tracker.add')}</Button>}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('tracker.filterFarm')}>
              <Select value={farmId} onChange={(e) => { setFarmId(e.target.value); setUpPage(1); setHistPage(1); }}>
                <option value="">{t('common.all')}</option>
                {(farms.data?.items ?? []).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </Select>
            </Field>
            <Field label={t('tracker.filterType')}>
              <Select value={type} onChange={(e) => { setType(e.target.value); setUpPage(1); setHistPage(1); }}>
                <option value="">{t('common.all')}</option>
                <option value="chemical">{t('tracker.type.chemical')}</option>
                <option value="organic">{t('tracker.type.organic')}</option>
              </Select>
            </Field>
          </div>
          <Tabs
            label={t('tracker.title')}
            idBase={base}
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'upcoming', label: t('tracker.tabUpcoming'), icon: ListTodo },
              { id: 'calendar', label: t('tracker.tabCalendar'), icon: CalendarDays },
              { id: 'history', label: t('tracker.tabHistory'), icon: History },
            ]}
          />
          <div {...tabPanelProps(base, 'upcoming', tab)}>
            {tab === 'upcoming' ? (
              <TreatmentList query={upcoming} onItemChange={onItemChange} emptyTitle={t('tracker.emptyUpcoming')} emptyText={t('tracker.emptyUpcomingText')} onPage={setUpPage} />
            ) : null}
          </div>
          <div {...tabPanelProps(base, 'calendar', tab)}>
            {tab === 'calendar' ? (
              <div className="space-y-4">
                <Card>
                  {calendar.error ? <ErrorState error={calendar.error} onRetry={calendar.reload} compact /> : (
                    <MonthCalendar month={month} setMonth={setMonth} items={calendar.data?.items ?? []} selected={selectedDay} onSelect={setSelectedDay} />
                  )}
                </Card>
                <h2 className="text-lg font-semibold">{formatDate(selectedDay, lang, { weekday: 'long' })}</h2>
                {dayItems.length ? (
                  <ul className="space-y-3">{dayItems.map((tr) => <TreatmentItem key={tr.id} tr={tr} onChange={onItemChange} />)}</ul>
                ) : (
                  <EmptyState compact icon={CalendarDays} title={t('tracker.emptyDay')} />
                )}
              </div>
            ) : null}
          </div>
          <div {...tabPanelProps(base, 'history', tab)}>
            {tab === 'history' ? (
              <TreatmentList query={history} onItemChange={onItemChange} emptyTitle={t('tracker.emptyHistory')} emptyText={t('tracker.emptyHistoryText')} onPage={setHistPage} />
            ) : null}
          </div>
        </div>
        <div className="space-y-6">
          <HarvestCalculator />
          <Card tone="inset">
            <p className="flex items-center gap-2 font-semibold"><Bell className="h-5 w-5 text-clay" aria-hidden="true" />{t('tracker.remindersTitle')}</p>
            <p className="mt-1 text-sm text-ink-muted">{t('tracker.remindersText')}</p>
          </Card>
        </div>
      </div>
      {farms.data?.items.length ? <AddTreatment open={adding} onClose={() => setAdding(false)} farms={farms.data.items} onCreated={refreshAll} /> : null}
    </div>
  );
}
