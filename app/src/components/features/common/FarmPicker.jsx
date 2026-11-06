import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Field, Select } from '@/components/ui';
import { usePrefs } from '@/store/prefsStore';

/** Resolves the active farm (persisted preference, else first farm). */
export function useActiveFarm(farms) {
  const activeFarmId = usePrefs((s) => s.activeFarmId);
  const setActiveFarmId = usePrefs((s) => s.setActiveFarmId);
  const list = farms ?? [];
  const valid = list.some((f) => f.id === activeFarmId);
  const farm = valid ? list.find((f) => f.id === activeFarmId) : list[0];

  useEffect(() => {
    if (list.length && !valid) setActiveFarmId(list[0].id);
  }, [list, valid, setActiveFarmId]);

  return { farm: farm ?? null, setFarmId: setActiveFarmId };
}

export default function FarmPicker({ farms, value, onChange, className, label }) {
  const { t } = useTranslation();
  if (!farms?.length) return null;
  return (
    <Field label={label ?? t('farms.selectFarm')} className={className}>
      <Select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {farms.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name} · {f.district}
          </option>
        ))}
      </Select>
    </Field>
  );
}
