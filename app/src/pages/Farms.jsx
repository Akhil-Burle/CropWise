import { useEffect, useState } from 'react';
import { Pencil, Plus, Tractor, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SOIL_TYPES } from '@/types';
import { toAppError, useServices } from '@/services';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useLang } from '@/hooks/useLang';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { usePrefs } from '@/store/prefsStore';
import { toast } from '@/store/toastStore';
import { Badge, Button, Card, Checkbox, EmptyState, ErrorState, Field, Modal, NumberInput, PageHeader, SegmentedControl, Select, SkeletonCards, TextInput } from '@/components/ui';
import MapPlaceholder from '@/components/features/common/MapPlaceholder';
import { formatDate, formatNumber } from '@/utils/format';

const EMPTY = { name: '', village: '', state: 'Karnataka', district: '', area: 1, areaUnit: 'acre', cropIds: [], soilType: null };

function FarmForm({ open, onClose, farm, crops, regions, onSaved }) {
  const { t } = useTranslation();
  const services = useServices();
  const toMessage = useErrorMessage();
  const defaultUnit = usePrefs((s) => s.areaUnit);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(farm ? { name: farm.name, village: farm.village, state: farm.state, district: farm.district, area: farm.area, areaUnit: farm.areaUnit, cropIds: farm.cropIds, soilType: farm.soilType } : { ...EMPTY, areaUnit: defaultUnit });
      setError(null);
    }
  }, [open, farm, defaultUnit]);

  const set = (p) => setForm((f) => ({ ...f, ...p }));
  const districts = regions.find((r) => r.state === form.state)?.districts ?? [];
  const fe = error?.fieldErrors ?? {};

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const input = { ...form, area: form.area ?? 0 };
      const saved = farm ? await services.farms.update(farm.id, input) : await services.farms.create(input);
      toast.success(farm ? t('farms.updated') : t('farms.created'), saved.name);
      onSaved();
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
      title={farm ? t('farms.edit') : t('farms.add')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={save} loading={saving}>{t('common.save')}</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('farms.name')} error={fe.name ? t('wizard.required') : undefined} required className="sm:col-span-2">
          <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder={t('farms.namePlaceholder')} />
        </Field>
        <Field label={t('farms.state')} error={fe.state ? t('wizard.required') : undefined} required>
          <Select value={form.state} onChange={(e) => set({ state: e.target.value, district: '' })}>
            {regions.map((r) => <option key={r.state} value={r.state}>{r.state}</option>)}
          </Select>
        </Field>
        <Field label={t('farms.district')} error={fe.district ? t('wizard.required') : undefined} required>
          <Select value={form.district} onChange={(e) => set({ district: e.target.value })}>
            <option value="">{t('farms.chooseDistrict')}</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </Field>
        <Field label={t('farms.village')} className="sm:col-span-2">
          <TextInput value={form.village} onChange={(e) => set({ village: e.target.value })} />
        </Field>
        <Field label={t('farms.area')} error={fe.area ? t('wizard.areaError') : undefined} required>
          <NumberInput value={form.area} onChange={(v) => set({ area: v })} step={0.5} min={0.1} max={500} />
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-semibold">{t('farms.unit')}</p>
          <SegmentedControl label={t('farms.unit')} value={form.areaUnit} onChange={(v) => set({ areaUnit: v })} options={[{ value: 'acre', label: t('units.acre_other') }, { value: 'hectare', label: t('units.hectare_other') }]} />
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="mb-1 text-sm font-semibold">{t('farms.crops')} <span className="text-danger" aria-hidden="true">*</span></legend>
          <div className="flex flex-wrap gap-x-6">
            {crops.map((c) => (
              <Checkbox
                key={c.id}
                label={c.name}
                checked={form.cropIds.includes(c.id)}
                onChange={(v) => set({ cropIds: v ? [...form.cropIds, c.id] : form.cropIds.filter((x) => x !== c.id) })}
              />
            ))}
          </div>
          {fe.cropIds ? <p className="text-sm text-danger" role="alert">{t('farms.cropRequired')}</p> : null}
        </fieldset>
        <Field label={t('farms.soilType')} className="sm:col-span-2">
          <Select value={form.soilType ?? ''} onChange={(e) => set({ soilType: e.target.value || null })}>
            <option value="">{t('farms.soilUnknown')}</option>
            {SOIL_TYPES.map((s) => <option key={s} value={s}>{t(`farms.soil.${s}`)}</option>)}
          </Select>
        </Field>
        {error && !error.fieldErrors ? <p className="text-sm text-danger sm:col-span-2" role="alert">{toMessage(error)?.title}</p> : null}
      </div>
    </Modal>
  );
}

export default function Farms() {
  const { t } = useTranslation();
  const lang = useLang();
  const services = useServices();
  const toMessage = useErrorMessage();
  const farms = useServiceQuery((s) => s.farms.list({ pageSize: 50 }), []);
  const crops = useServiceQuery((s) => s.farms.listCrops(lang), [lang]);
  const regions = useServiceQuery((s) => s.farms.listRegions(), []);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const cropName = (id) => crops.data?.find((c) => c.id === id)?.name ?? id;

  const openForm = (farm) => {
    setEditing(farm);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await services.farms.remove(deleting.id);
      toast.success(t('farms.deleted'), deleting.name);
      setDeleting(null);
      farms.reload();
    } catch (e) {
      toast.error(toMessage(toAppError(e))?.title ?? '');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow={t('farms.eyebrow')} title={t('farms.title')} subtitle={t('farms.subtitle')} actions={<Button icon={Plus} onClick={() => openForm(null)} disabled={!regions.data}>{t('farms.add')}</Button>} />
      {farms.loading ? (
        <SkeletonCards count={3} className="md:grid-cols-2 xl:grid-cols-3" cardClassName="h-80" />
      ) : farms.error ? (
        <ErrorState error={farms.error} onRetry={farms.reload} />
      ) : farms.data.items.length === 0 ? (
        <EmptyState icon={Tractor} title={t('farms.empty')} description={t('farms.emptyText')} action={<Button icon={Plus} onClick={() => openForm(null)}>{t('farms.add')}</Button>} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {farms.data.items.map((f, i) => (
            <li key={f.id}>
              <Card className="flex h-full flex-col">
                <MapPlaceholder name={f.name} location={f.location} seed={i + 3} />
                <h2 className="mt-4 text-xl font-semibold">{f.name}</h2>
                <p className="text-sm text-ink-muted">{[f.village, f.district, f.state].filter(Boolean).join(', ')}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div><dt className="text-ink-muted">{t('farms.area')}</dt><dd className="font-semibold">{formatNumber(f.area, lang)} {t(`units.${f.areaUnit}`, { count: f.area })}</dd></div>
                  <div><dt className="text-ink-muted">{t('farms.soilType')}</dt><dd className="font-semibold">{f.soilType ? t(`farms.soil.${f.soilType}`) : '—'}</dd></div>
                  <div className="col-span-2"><dt className="text-ink-muted">{t('farms.lastTest')}</dt><dd className="font-semibold">{formatDate(f.lastSoilTestDate, lang)}</dd></div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {f.cropIds.map((c) => <Badge key={c} tone="organic">{cropName(c)}</Badge>)}
                </div>
                <div className="mt-auto flex gap-2 pt-4">
                  <Button variant="secondary" size="sm" icon={Pencil} onClick={() => openForm(f)} disabled={!regions.data}>{t('common.edit')}</Button>
                  <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleting(f)}>{t('common.delete')}</Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
      {regions.data && crops.data ? (
        <FarmForm open={formOpen} onClose={() => setFormOpen(false)} farm={editing} crops={crops.data} regions={regions.data} onSaved={farms.reload} />
      ) : null}
      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={t('farms.deleteTitle')}
        description={deleting ? t('farms.deleteText', { name: deleting.name }) : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>{t('common.cancel')}</Button>
            <Button variant="danger" icon={Trash2} onClick={confirmDelete} loading={busy}>{t('common.delete')}</Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">{t('farms.deleteNote')}</p>
      </Modal>
    </div>
  );
}
