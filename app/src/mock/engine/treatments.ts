import type { Lang } from '@/types';
import type { TreatmentDto } from '@/services/schemas';
import type { MockTreatment } from '../db';
import { db } from '../db';
import { cropById } from '../data/reference';
import { translator } from '../data/localize';
import { addDays, daysBetween, todayIso } from './dates';

export function harvestSafe(applicationDate: string, phiDays: number) {
  const safeDate = addDays(applicationDate, phiDays);
  const daysRemaining = Math.max(0, daysBetween(todayIso(), safeDate));
  return { safeDate, daysRemaining, isSafeToday: daysRemaining === 0 };
}

export function renderTreatment(tr: MockTreatment, lang: Lang): TreatmentDto {
  const today = todayIso();
  const farm = db.farms.find((f) => f.id === tr.farmId);
  const { t } = translator(lang);
  const status: TreatmentDto['status'] = tr.skipped
    ? 'skipped'
    : tr.doneDate
      ? 'done'
      : daysBetween(today, tr.scheduledDate) < 0
        ? 'overdue'
        : 'scheduled';
  const safe = tr.doneDate && tr.phiDays ? harvestSafe(tr.doneDate, tr.phiDays) : null;
  return {
    id: tr.id,
    farmId: tr.farmId,
    farmName: farm?.name ?? null,
    cropName: tr.cropId ? t(cropById(tr.cropId).name) : null,
    type: tr.type,
    title: tr.title,
    product: tr.product,
    dose: tr.dose,
    scheduledDate: tr.scheduledDate,
    doneDate: tr.doneDate,
    phiDays: tr.phiDays,
    harvestSafeDate: safe?.safeDate ?? null,
    daysToSafe: safe?.daysRemaining ?? null,
    status,
    reminder: tr.reminder,
    analysisId: tr.analysisId,
    notes: tr.notes,
  };
}
