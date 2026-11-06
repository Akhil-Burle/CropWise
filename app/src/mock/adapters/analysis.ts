import type { AdvisoryService, AnalysisService, DemoService } from '@/services/contracts';
import { decode, decodeList, decodePage } from '@/services/decode';
import { appError } from '@/services/errors';
import {
  AdvisoryReportSchema,
  AnalysisResultSchema,
  AnalysisSummarySchema,
  DemoScenarioSchema,
  DualAdvisorySchema,
  JobRefSchema,
  JobStatusSchema,
  SampleAssetSchema,
  SavedSchema,
  ShareMessageSchema,
  UploadRefSchema,
} from '@/services/schemas';
import {
  toAdvisory,
  toAdvisoryReport,
  toAnalysisResult,
  toAnalysisSummary,
  toDemoScenario,
  toJobRef,
  toJobStatus,
  toSampleAsset,
  toSaved,
  toShareMessage,
  toUploadRef,
} from '@/services/mappers';
import { createUploadService, type UploadTransport } from '@/services/upload/pipeline';
import type { AnalysisInput, NutrientKey } from '@/types';
import { commit, currentUserId, db, isStaff, resetDb, type MockAnalysis, type MockUpload } from '../db';
import { translator } from '../data/localize';
import { DEFAULT_BY_CROP, SAMPLES, SCENARIOS, SOIL_OUTCOMES } from '../data/scenarios';
import { armSessionExpiry, fail, respond, uid } from '../latency';
import { matches, paginate } from '../paginate';
import { jobStatus, renderAnalysis, soilReadings, summarize } from '../engine/analysis';
import { buildAdvisory } from '../engine/advisory';
import { findFarm } from './farm';

/* ---------------- Uploads ---------------- */

function readAsDataUrl(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof FileReader === 'undefined') {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

/**
 * Simulated transport: reports progress over ~1.5 s and honours AbortSignal.
 * A file whose name contains "fail" is rejected, to demo the upload error state.
 */
const mockTransport: UploadTransport = (body, meta, { onProgress, signal }) =>
  new Promise((resolve, reject) => {
    let pct = 0;
    const timer = setInterval(async () => {
      pct = Math.min(100, pct + 8 + Math.random() * 14);
      onProgress?.(Math.round(pct));
      if (pct >= 100) {
        clearInterval(timer);
        if (/fail/i.test(meta.fileName)) {
          reject(appError('UPLOAD_FAILED', 'Simulated upload failure'));
          return;
        }
        const preview = body.type.startsWith('image/')
          ? body.size < 700_000
            ? await readAsDataUrl(body)
            : URL.createObjectURL(body)
          : null;
        const upload: MockUpload = {
          id: uid('up'),
          kind: meta.kind,
          fileName: meta.fileName,
          mimeType: meta.mimeType,
          sizeBytes: body.size,
          previewUrl: preview,
          sampleId: null,
        };
        db.uploads.push(upload);
        commit();
        resolve({ ...upload, isSample: false });
      }
    }, 130);
    signal?.addEventListener('abort', () => {
      clearInterval(timer);
      reject(appError('CANCELLED', 'Upload cancelled', { retryable: false }));
    });
  });

export const mockUploads = createUploadService(mockTransport);

/* ---------------- Demo samples ---------------- */

export const mockDemo: DemoService = {
  async listSamples(kind, lang) {
    const { t } = translator(lang);
    const raw = SAMPLES.filter((s) => s.kind === kind).map((s) => ({
      id: s.id,
      kind: s.kind,
      title: t(s.title),
      description: t(s.description),
      imageUrl: s.imageUrl,
    }));
    return decodeList(SampleAssetSchema, await respond(raw, 100, 250), toSampleAsset);
  },

  async listScenarios(lang) {
    const { t } = translator(lang);
    const raw = SCENARIOS.map((s) => ({ ...s, title: t(s.title), description: t(s.description) }));
    return decodeList(DemoScenarioSchema, await respond(raw, 100, 250), toDemoScenario);
  },

  async useSample(sampleId) {
    const sample = SAMPLES.find((s) => s.id === sampleId);
    if (!sample) return fail('NOT_FOUND', 'Sample not found');
    const upload: MockUpload = {
      id: uid('up'),
      kind: sample.kind,
      fileName: sample.fileName,
      mimeType: 'image/svg+xml',
      sizeBytes: null,
      previewUrl: sample.imageUrl,
      sampleId: sample.id,
    };
    db.uploads.push(upload);
    commit();
    return decode(UploadRefSchema, await respond({ ...upload, isSample: true }, 250, 500), toUploadRef);
  },

  async simulateSessionExpiry() {
    db.sessionUserId = null;
    commit();
    armSessionExpiry();
  },

  async resetDemoData() {
    resetDb();
    await respond(null, 300, 500);
  },
};

/* ---------------- Analysis jobs ---------------- */

function findAnalysis(id: string): MockAnalysis {
  const a = db.analyses.find((x) => x.id === id && !x.pending);
  if (!a) throw appError('NOT_FOUND', `Analysis ${id} not found`, { retryable: false });
  return a;
}

function findJob(jobId: string) {
  const job = db.jobs.find((j) => j.id === jobId);
  if (!job) throw appError('NOT_FOUND', `Job ${jobId} not found`, { retryable: false });
  return job;
}

function createJob(input: AnalysisInput): string {
  const farm = findFarm(input.farmId);
  const soilUpload = input.soilUploadId ? db.uploads.find((u) => u.id === input.soilUploadId) : undefined;
  const leafUpload = input.leafUploadId ? db.uploads.find((u) => u.id === input.leafUploadId) : undefined;
  const defaults = DEFAULT_BY_CROP[input.cropId] ?? DEFAULT_BY_CROP.tomato;
  const soilKey = soilUpload ? soilUpload.sampleId ?? defaults.soil : null;
  const soilOutcome = soilKey ? SOIL_OUTCOMES[soilKey] : undefined;

  const jobId = uid('job');
  const analysisId = uid('an');
  db.analyses.unshift({
    id: analysisId,
    jobId,
    ownerId: currentUserId(),
    createdAt: new Date().toISOString(),
    pending: true,
    farmId: farm.id,
    cropId: input.cropId,
    growthStage: input.growthStage,
    area: input.area,
    areaUnit: input.areaUnit,
    soilKey,
    soilCardUrl: soilUpload?.previewUrl ?? null,
    // Highlight boxes only line up with the bundled sample cards.
    soilWithRegions: Boolean(soilUpload?.sampleId) && soilOutcome?.kind === 'ok',
    soilSampleDate: soilOutcome?.kind === 'ok' ? soilOutcome.sampleDate : null,
    soilOverrides: null,
    soilConfirmed: false,
    leafKey: leafUpload ? leafUpload.sampleId ?? defaults.leaf : null,
    leafImageUrl: leafUpload?.previewUrl ?? null,
    saved: false,
  });
  db.jobs.push({ id: jobId, startedAt: Date.now(), input, cancelled: false, analysisId });
  commit();
  return jobId;
}

const SOIL_LIMITS: Record<NutrientKey, [number, number]> = {
  N: [0, 2000],
  P: [0, 500],
  K: [0, 3000],
  pH: [0, 14],
  EC: [0, 20],
  OC: [0, 5],
};

export const mockAnalysis: AnalysisService = {
  async submit(input) {
    await respond(null, 300, 600);
    const fieldErrors: Record<string, string> = {};
    if (!input.farmId) fieldErrors.farmId = 'required';
    if (!input.cropId) fieldErrors.cropId = 'required';
    if (!(input.area > 0) || input.area > 500) fieldErrors.area = 'range';
    if (!input.soilUploadId && !input.leafUploadId) fieldErrors.uploads = 'required';
    if (Object.keys(fieldErrors).length) throw appError('VALIDATION', 'Invalid analysis input', { retryable: false, fieldErrors });
    return decode(JobRefSchema, { jobId: createJob(input) }, toJobRef);
  },

  async getStatus(jobId) {
    const job = findJob(jobId);
    const status = jobStatus(job, Date.now());
    if (status.state === 'completed') {
      const a = db.analyses.find((x) => x.id === job.analysisId);
      if (a?.pending) {
        a.pending = false;
        commit();
      }
    }
    return decode(JobStatusSchema, await respond(status, 120, 300), toJobStatus);
  },

  async getResult(jobId, lang) {
    const job = findJob(jobId);
    const a = db.analyses.find((x) => x.id === job.analysisId);
    if (!a || a.pending) return fail('VALIDATION', 'Result not ready yet');
    return decode(AnalysisResultSchema, await respond(renderAnalysis(a, lang)), toAnalysisResult);
  },

  async cancel(jobId) {
    const job = findJob(jobId);
    job.cancelled = true;
    db.analyses = db.analyses.filter((a) => !(a.id === job.analysisId && a.pending));
    commit();
    await respond(null, 100, 200);
  },

  async retry(jobId) {
    const job = findJob(jobId);
    await respond(null, 200, 400);
    return decode(JobRefSchema, { jobId: createJob(job.input) }, toJobRef);
  },

  async get(id, lang) {
    const a = findAnalysis(id);
    return decode(AnalysisResultSchema, await respond(renderAnalysis(a, lang)), toAnalysisResult);
  },

  async confirmSoil(id, values, lang) {
    const a = findAnalysis(id);
    await respond(null, 400, 800);
    const fieldErrors: Record<string, string> = {};
    values.forEach((v) => {
      const [min, max] = SOIL_LIMITS[v.key];
      if (!Number.isFinite(v.value) || v.value < min || v.value > max) fieldErrors[v.key] = 'range';
    });
    if (Object.keys(fieldErrors).length) throw appError('VALIDATION', 'Soil values out of range', { retryable: false, fieldErrors });

    const original = a.soilKey ? SOIL_OUTCOMES[a.soilKey] : undefined;
    const overrides: Partial<Record<NutrientKey, number>> = {};
    values.forEach((v) => {
      const ocr = original?.kind === 'ok' ? original.readings.find((r) => r.key === v.key)?.value : undefined;
      if (ocr !== v.value) overrides[v.key] = v.value;
    });
    a.soilOverrides = Object.keys(overrides).length ? overrides : null;
    if (!a.soilSampleDate) a.soilSampleDate = new Date().toISOString().slice(0, 10);
    a.soilConfirmed = true;
    commit();
    return decode(AnalysisResultSchema, renderAnalysis(a, lang), toAnalysisResult);
  },

  async list(params) {
    const rows = db.analyses
      .filter((a) => (isStaff() || a.ownerId === currentUserId()) && !a.pending)
      .filter((a) => (!params.farmId || a.farmId === params.farmId) && (!params.cropId || a.cropId === params.cropId))
      .map((a) => summarize(a, params.lang))
      .filter((s) => !params.status || s.status === params.status)
      .filter((s) => matches(params.search, s.cropName, s.diseaseName, s.farmName))
      .sort((x, y) => (params.sort === 'oldest' ? x.createdAt.localeCompare(y.createdAt) : y.createdAt.localeCompare(x.createdAt)));
    return decodePage(AnalysisSummarySchema, await respond(paginate(rows, params)), toAnalysisSummary);
  },

  async remove(id) {
    findAnalysis(id);
    db.analyses = db.analyses.filter((a) => a.id !== id);
    commit();
    await respond(null, 200, 400);
  },
};

/* ---------------- Advisory ---------------- */

const analysisForAdvisory = (advisoryId: string) => findAnalysis(advisoryId.replace(/^adv-/, ''));

export const mockAdvisory: AdvisoryService = {
  async getAdvisory({ analysisId, area, areaUnit, lang }) {
    const a = findAnalysis(analysisId);
    if (!(area > 0) || area > 500) {
      await respond(null, 100, 200);
      throw appError('VALIDATION', 'Area out of range', { retryable: false, fieldErrors: { area: 'range' } });
    }
    if (!soilReadings(a) && !a.leafKey) return fail('NOT_FOUND', 'Nothing to advise on');
    return decode(DualAdvisorySchema, await respond(buildAdvisory(a, area, areaUnit, lang), 350, 800), toAdvisory);
  },

  async save(advisoryId) {
    const a = analysisForAdvisory(advisoryId);
    a.saved = true;
    commit();
    return decode(SavedSchema, await respond({ saved: true }), toSaved);
  },

  async getAdvisoryReport() {
    // The mock has no PDF renderer: the UI falls back to the print stylesheet.
    return decode(AdvisoryReportSchema, await respond({ kind: 'unavailable' }, 150, 300), toAdvisoryReport);
  },

  async getShareMessage(advisoryId, lang) {
    const a = analysisForAdvisory(advisoryId);
    const adv = buildAdvisory(a, a.area, a.areaUnit, lang);
    const { t } = translator(lang);
    const unit = a.areaUnit === 'hectare' ? 'ha' : t({ en: 'acre', hi: 'एकड़', kn: 'ಎಕರೆ' });
    const lines = [
      `CropWise – ${adv.cropName}${adv.diseaseName ? ` · ${adv.diseaseName}` : ''}`,
      '',
    ];
    if (adv.chemical) {
      const c = adv.chemical;
      lines.push(
        `${t({ en: 'Chemical', hi: 'रासायनिक', kn: 'ರಾಸಾಯನಿಕ' })}: ${c.formulation} – ${c.dose.perArea.value} ${c.dose.perArea.unit}/${unit}, ${c.water.perArea.value} L ${t({ en: 'water', hi: 'पानी', kn: 'ನೀರು' })}/${unit}. PHI ${c.phiDays} ${t({ en: 'days', hi: 'दिन', kn: 'ದಿನ' })}. ${c.toxicity.label}.`,
        t({ en: 'Wear gloves, mask, goggles and full sleeves.', hi: 'दस्ताने, मास्क, चश्मा और पूरी बांह पहनें।', kn: 'ಕೈಗವಸು, ಮಾಸ್ಕ್, ಕನ್ನಡಕ ಮತ್ತು ಪೂರ್ಣ ತೋಳು ಧರಿಸಿ.' }),
        '',
      );
    }
    const agents = adv.organic.agents.map((g) => `${g.name} (${g.dose.perArea.value} ${g.dose.perArea.unit}/${unit})`);
    if (agents.length) lines.push(`${t({ en: 'Organic & IPM', hi: 'जैविक व IPM', kn: 'ಸಾವಯವ ಮತ್ತು IPM' })}: ${agents.join('; ')}`);
    const amend = (adv.organic.amendments ?? []).filter((m) => m.dose.perArea.value > 0).map((m) => m.product);
    if (amend.length) lines.push(`${t({ en: 'Soil', hi: 'मिट्टी', kn: 'ಮಣ್ಣು' })}: ${amend.join('; ')}`);
    lines.push('', adv.disclaimer);
    return decode(ShareMessageSchema, await respond({ text: lines.join('\n') }, 150, 300), toShareMessage);
  },
};
