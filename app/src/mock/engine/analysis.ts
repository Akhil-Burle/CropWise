import type { AnalysisStage, Lang, NutrientKey } from '@/types';
import type { AnalysisResultDto, AnalysisSummaryDto, DiseasePredictionDto, JobStatusDto, SoilReportDto } from '@/services/schemas';
import { db, type MockAnalysis, type MockJob } from '../db';
import { cropById } from '../data/reference';
import { diseaseById } from '../data/diseases';
import { translator } from '../data/localize';
import { LEAF_OUTCOMES, SAMPLES, SOIL_OUTCOMES } from '../data/scenarios';
import { buildSoilValues, type RawReading } from './soil';

export const CONFIDENCE_THRESHOLD = 0.7;

const ERR = {
  UNREADABLE_SOIL_CARD: { code: 'UNREADABLE_SOIL_CARD', message: 'Soil values could not be read from the card', retryable: false },
  LEAF_NOT_DETECTED: { code: 'LEAF_NOT_DETECTED', message: 'No crop leaf found in the photo', retryable: false },
} as const;

export function soilReadings(a: MockAnalysis): RawReading[] | null {
  const outcome = a.soilKey ? SOIL_OUTCOMES[a.soilKey] : undefined;
  const base: RawReading[] = outcome?.kind === 'ok' ? outcome.readings : [];
  if (!outcome && !a.soilOverrides) return null;
  if (outcome?.kind === 'error' && !a.soilOverrides) return null;
  const overrides = a.soilOverrides ?? {};
  const keys: NutrientKey[] = ['pH', 'EC', 'OC', 'N', 'P', 'K'];
  return keys.map((key) => {
    const o = overrides[key];
    if (o !== undefined) return { key, value: o, confidence: null };
    return base.find((r) => r.key === key) ?? { key, value: null, confidence: null };
  });
}

export function renderSoil(a: MockAnalysis, lang: Lang): { soil: SoilReportDto | null; soilError: AnalysisResultDto['soilError'] } {
  if (!a.soilKey && !a.soilOverrides) return { soil: null, soilError: null };
  const outcome = a.soilKey ? SOIL_OUTCOMES[a.soilKey] : undefined;
  const readings = soilReadings(a);
  if (!readings) return { soil: null, soilError: ERR.UNREADABLE_SOIL_CARD };
  const isManual = outcome?.kind !== 'ok';
  return {
    soil: {
      id: `soil-${a.id}`,
      farmId: a.farmId,
      sampleDate: a.soilSampleDate,
      labName: outcome?.kind === 'ok' ? outcome.labName : null,
      cardImageUrl: a.soilCardUrl,
      source: isManual ? 'manual' : 'ocr',
      confirmed: a.soilConfirmed,
      values: buildSoilValues(readings, lang, a.soilWithRegions && !isManual),
    },
    // Keep the original OCR error visible even after manual entry so the history is honest.
    soilError: outcome?.kind === 'error' ? ERR.UNREADABLE_SOIL_CARD : null,
  };
}

export function renderDiagnosis(
  a: MockAnalysis,
  lang: Lang,
): { diagnosis: DiseasePredictionDto | null; diagnosisError: AnalysisResultDto['diagnosisError'] } {
  if (!a.leafKey) return { diagnosis: null, diagnosisError: null };
  const outcome = LEAF_OUTCOMES[a.leafKey];
  if (!outcome || outcome.kind === 'error') return { diagnosis: null, diagnosisError: ERR.LEAF_NOT_DETECTED };
  const p = outcome.prediction;
  const d = diseaseById(p.diseaseId);
  const tr = translator(lang);
  const sample = SAMPLES.find((s) => s.id === a.leafKey);
  return {
    diagnosis: {
      id: `dx-${a.id}`,
      cropId: d.cropId,
      diseaseId: d.healthy ? null : d.id,
      name: tr.t(d.name),
      scientificName: d.scientificName,
      isHealthy: d.healthy,
      confidence: p.confidence,
      confidenceThreshold: CONFIDENCE_THRESHOLD,
      lowConfidence: p.confidence < CONFIDENCE_THRESHOLD,
      alternatives: p.alternatives.map((alt) => {
        const ad = diseaseById(alt.diseaseId);
        return { diseaseId: ad.healthy ? null : ad.id, name: tr.t(ad.name), probability: alt.probability };
      }),
      description: tr.t(d.description),
      symptoms: tr.list(d.symptoms),
      severity: p.severity,
      affectedAreaPct: p.affectedAreaPct,
      leafImageUrl: a.leafImageUrl ?? sample?.imageUrl ?? null,
      contentLang: tr.served(),
    },
    diagnosisError: null,
  };
}

export function renderAnalysis(a: MockAnalysis, lang: Lang): AnalysisResultDto {
  const farm = db.farms.find((f) => f.id === a.farmId);
  const { t } = translator(lang);
  return {
    id: a.id,
    createdAt: a.createdAt,
    farmId: a.farmId,
    farmName: farm?.name ?? null,
    cropId: a.cropId,
    cropName: t(cropById(a.cropId).name),
    growthStage: a.growthStage,
    area: a.area,
    areaUnit: a.areaUnit,
    ...renderSoil(a, lang),
    ...renderDiagnosis(a, lang),
    soilConfirmed: a.soilConfirmed,
    saved: a.saved,
  };
}

export function summarize(a: MockAnalysis, lang: Lang): AnalysisSummaryDto {
  const r = renderAnalysis(a, lang);
  const partial = Boolean(r.soilError || r.diagnosisError);
  const needsReview = !partial && (!r.soilConfirmed || Boolean(r.diagnosis?.lowConfidence));
  return {
    id: r.id,
    createdAt: r.createdAt,
    farmId: r.farmId,
    farmName: r.farmName,
    cropId: r.cropId,
    cropName: r.cropName,
    diseaseName: r.diagnosis?.name ?? null,
    isHealthy: r.diagnosis?.isHealthy ?? null,
    confidence: r.diagnosis?.confidence ?? null,
    status: partial ? 'partial' : needsReview ? 'needs_review' : 'complete',
    saved: r.saved ?? false,
  };
}

/* ---------------- Job lifecycle simulation ---------------- */

const QUEUE_MS = 700;
const STAGE_MS: Record<AnalysisStage, number> = {
  cleaning: 1300,
  reading_soil: 1700,
  analysing_leaf: 1800,
  matching_protocols: 1300,
};

function plannedStages(job: MockJob): AnalysisStage[] {
  const stages: AnalysisStage[] = ['cleaning'];
  if (job.input.soilUploadId) stages.push('reading_soil');
  if (job.input.leafUploadId) stages.push('analysing_leaf');
  stages.push('matching_protocols');
  return stages;
}

export function jobStatus(job: MockJob, now: number): JobStatusDto {
  if (job.cancelled) return { state: 'cancelled' };
  const elapsed = now - job.startedAt;
  if (elapsed < QUEUE_MS) return { state: 'queued', position: 1 };
  const stages = plannedStages(job);
  const total = stages.reduce((s, st) => s + STAGE_MS[st], 0);
  let t = elapsed - QUEUE_MS;
  const completed: AnalysisStage[] = [];
  for (const stage of stages) {
    if (t < STAGE_MS[stage]) {
      const done = completed.reduce((s, st) => s + STAGE_MS[st], 0) + t;
      return { state: 'processing', stage, progress: Math.min(99, Math.round((done / total) * 100)), completedStages: completed };
    }
    t -= STAGE_MS[stage];
    completed.push(stage);
  }

  const analysis = db.analyses.find((a) => a.id === job.analysisId);
  if (!analysis) return { state: 'failed', error: { code: 'NOT_FOUND', message: 'Analysis missing', retryable: true } };
  const soilState = !analysis.soilKey ? 'skipped' : SOIL_OUTCOMES[analysis.soilKey]?.kind === 'error' ? 'failed' : 'ok';
  const leafState = !analysis.leafKey ? 'skipped' : LEAF_OUTCOMES[analysis.leafKey]?.kind === 'error' ? 'failed' : 'ok';
  if (soilState !== 'ok' && leafState !== 'ok') {
    return {
      state: 'failed',
      error: { code: soilState === 'failed' ? 'UNREADABLE_SOIL_CARD' : 'LEAF_NOT_DETECTED', message: 'Nothing could be analysed', retryable: false },
    };
  }
  return { state: 'completed', analysisId: analysis.id, parts: { soil: soilState, leaf: leafState } };
}
