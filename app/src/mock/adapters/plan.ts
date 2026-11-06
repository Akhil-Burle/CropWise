import type { TransitionService, TreatmentService } from '@/services/contracts';
import { decode, decodeList, decodePage } from '@/services/decode';
import { appError } from '@/services/errors';
import { HarvestSafeSchema, PhiAlertSchema, SeasonTaskSchema, TransitionPlanSchema, TreatmentSchema } from '@/services/schemas';
import { toHarvestSafe, toPhiAlert, toSeasonTask, toTransitionPlan, toTreatment } from '@/services/mappers';
import type { Lang, TransitionSpeed } from '@/types';
import { commit, db, type MockTreatment } from '../db';
import { fail, respond, uid } from '../latency';
import { matches, paginate } from '../paginate';
import { buildPlan } from '../engine/transition';
import { harvestSafe, renderTreatment } from '../engine/treatments';
import { allReports, findFarm, myFarms } from './farm';

function socFor(farmId: string): number {
  const latest = allReports(farmId, 'en')[0];
  return latest?.values.find((v) => v.key === 'OC')?.value ?? 0.45;
}

function parsePlanId(planId: string): { farmId: string; speed: TransitionSpeed } {
  const m = /^plan-(.+)-(conservative|balanced|aggressive)$/.exec(planId);
  if (!m) throw appError('NOT_FOUND', 'Unknown plan', { retryable: false });
  return { farmId: m[1], speed: m[2] as TransitionSpeed };
}

export const mockTransition: TransitionService = {
  async getPlan({ farmId, speed, lang }) {
    const farm = findFarm(farmId);
    const raw = buildPlan({ farm, socStart: socFor(farmId), speed, doneTaskIds: db.planTasks[farmId] ?? [], lang });
    return decode(TransitionPlanSchema, await respond(raw, 350, 750), toTransitionPlan);
  },

  async setTaskDone({ planId, taskId, done, lang }) {
    const { farmId, speed } = parsePlanId(planId);
    const farm = findFarm(farmId);
    const set = new Set(db.planTasks[farmId] ?? []);
    if (done) set.add(taskId);
    else set.delete(taskId);
    db.planTasks[farmId] = [...set];
    commit();
    const plan = buildPlan({ farm, socStart: socFor(farmId), speed, doneTaskIds: db.planTasks[farmId], lang });
    const task = plan.seasons.flatMap((s) => s.tasks).find((t) => t.id === taskId);
    if (!task) return fail('NOT_FOUND', 'Task not found');
    return decode(SeasonTaskSchema, await respond(task, 150, 300), toSeasonTask);
  },
};

function findTreatment(id: string): MockTreatment {
  const t = db.treatments.find((x) => x.id === id);
  if (!t) throw appError('NOT_FOUND', `Treatment ${id} not found`, { retryable: false });
  return t;
}

const render = (t: MockTreatment, lang: Lang) => decode(TreatmentSchema, renderTreatment(t, lang), toTreatment);

export const mockTreatments: TreatmentService = {
  async list(params) {
    const farmIds = new Set(myFarms().map((f) => f.id));
    const rows = db.treatments
      .filter((t) => farmIds.has(t.farmId))
      .filter((t) => !params.farmId || t.farmId === params.farmId)
      .filter((t) => !params.type || t.type === params.type)
      .filter((t) => !params.from || t.scheduledDate >= params.from)
      .filter((t) => !params.to || t.scheduledDate <= params.to)
      .map((t) => renderTreatment(t, params.lang))
      .filter((t) => !params.status || t.status === params.status)
      .filter((t) => !params.openOnly || t.status === 'scheduled' || t.status === 'overdue')
      .filter((t) => matches(params.search, t.title, t.product, t.farmName))
      .sort((a, b) =>
        params.sort === 'date_desc'
          ? b.scheduledDate.localeCompare(a.scheduledDate)
          : a.scheduledDate.localeCompare(b.scheduledDate),
      );
    return decodePage(TreatmentSchema, await respond(paginate(rows, params)), toTreatment);
  },

  async create(input, lang) {
    await respond(null, 300, 600);
    const fieldErrors: Record<string, string> = {};
    if (!input.title.trim()) fieldErrors.title = 'required';
    if (!input.product.trim()) fieldErrors.product = 'required';
    if (!input.scheduledDate) fieldErrors.scheduledDate = 'required';
    if (input.phiDays !== null && (input.phiDays < 0 || input.phiDays > 180)) fieldErrors.phiDays = 'range';
    if (Object.keys(fieldErrors).length) throw appError('VALIDATION', 'Invalid treatment', { retryable: false, fieldErrors });
    const farm = findFarm(input.farmId);
    const t: MockTreatment = {
      id: uid('tr'),
      farmId: farm.id,
      cropId: farm.cropIds[0] ?? null,
      type: input.type,
      title: input.title.trim(),
      product: input.product.trim(),
      dose: input.dose,
      scheduledDate: input.scheduledDate,
      doneDate: null,
      phiDays: input.phiDays,
      skipped: false,
      reminder: input.reminder,
      analysisId: input.analysisId,
      notes: null,
    };
    db.treatments.push(t);
    commit();
    return render(t, lang);
  },

  async markDone(id, doneDate, lang) {
    const t = findTreatment(id);
    t.doneDate = doneDate;
    t.skipped = false;
    commit();
    await respond(null, 200, 400);
    return render(t, lang);
  },

  async skip(id, lang) {
    const t = findTreatment(id);
    t.skipped = true;
    t.doneDate = null;
    commit();
    await respond(null, 200, 400);
    return render(t, lang);
  },

  async setReminder(id, enabled, lang) {
    const t = findTreatment(id);
    t.reminder = enabled;
    commit();
    await respond(null, 150, 300);
    return render(t, lang);
  },

  async calculateHarvestSafe({ applicationDate, phiDays }) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(applicationDate) || !(phiDays >= 0) || phiDays > 180) {
      await respond(null, 100, 200);
      throw appError('VALIDATION', 'Invalid input', { retryable: false, fieldErrors: { phiDays: 'range' } });
    }
    return decode(HarvestSafeSchema, await respond(harvestSafe(applicationDate, Math.round(phiDays)), 150, 300), toHarvestSafe);
  },

  async getPhiAlerts(lang) {
    const farmIds = new Set(myFarms().map((f) => f.id));
    const raw = db.treatments
      .filter((t) => farmIds.has(t.farmId) && t.type === 'chemical' && t.doneDate && t.phiDays)
      .map((t) => renderTreatment(t, lang))
      .filter((t) => (t.daysToSafe ?? 0) > 0)
      .sort((a, b) => (a.daysToSafe ?? 0) - (b.daysToSafe ?? 0))
      .map((t) => ({
        treatmentId: t.id,
        farmName: t.farmName ?? '',
        cropName: t.cropName ?? '',
        product: t.product,
        safeDate: t.harvestSafeDate ?? '',
        daysRemaining: t.daysToSafe ?? 0,
      }));
    return decodeList(PhiAlertSchema, await respond(raw), toPhiAlert);
  },
};
