/**
 * "local" data source: the leaf photo and soil card really go to the ML backend on this machine
 * (uploads + analysis jobs), while everything the backend does not serve yet (accounts, farms,
 * advisory, learning content…) keeps using the mock data. Select it with VITE_DATA_SOURCE=local.
 *
 * Advice is the one mock piece that must follow the real analysis, so it is bridged below.
 * Delete the mock overrides here as the backend grows; when nothing is left, switch to "http".
 */
import { createMockServices } from '@/mock';
import { commit, currentUserId, db, type MockAnalysis } from '@/mock/db';
import { DISEASES, type MockDisease } from '@/mock/data/diseases';
import { LEAF_OUTCOMES } from '@/mock/data/scenarios';
import type { AnalysisResult, NutrientKey } from '@/types';
import type { AdvisoryService, Services } from './contracts';
import { httpAnalysis, httpListCrops, httpUploads } from './http';

/**
 * Real model class (`<crop>_<disease>`) → disease that has a demo spray protocol in the mock advice
 * engine. Any class not listed gets general organic guidance and NO chemical dose, rather than
 * borrowing a protocol written for a different disease.
 */
const MOCK_PROTOCOL: Record<string, string> = {
  tomato_early_blight: 'tomato_early_blight',
  tomato_septoria_leaf_spot: 'tomato_septoria',
  potato_late_blight: 'potato_late_blight',
};

/** Stand-ins for "a real diagnosis the demo engine has no protocol for". They carry no protocol. */
const GENERIC = { problem: 'real_unlisted_problem', healthy: 'real_healthy_leaf' } as const;
const generic = (id: string, healthy: boolean): MockDisease => ({
  id,
  cropId: 'tomato',
  healthy,
  name: { en: healthy ? 'Healthy leaf' : 'Detected problem' },
  scientificName: null,
  description: { en: '' },
  symptoms: [],
});
if (!DISEASES.some((d) => d.id === GENERIC.problem)) {
  DISEASES.push(generic(GENERIC.problem, false), generic(GENERIC.healthy, true));
}

/**
 * Registers a real analysis with the mock advice engine so advice, "save", share and spray
 * reminders work for it. Re-run on every request so confirmed soil values and the saved flag
 * stay current.
 */
function syncShadowAnalysis(real: AnalysisResult): void {
  const dx = real.diagnosis;
  const leafKey = dx ? `real-${real.id}` : null;
  if (dx && leafKey) {
    const diseaseId =
      (dx.diseaseId ? MOCK_PROTOCOL[dx.diseaseId] : undefined) ?? (dx.isHealthy ? GENERIC.healthy : GENERIC.problem);
    LEAF_OUTCOMES[leafKey] = {
      kind: 'ok',
      prediction: { diseaseId, confidence: dx.confidence, severity: 'moderate', affectedAreaPct: null, alternatives: [] },
    };
  }

  const overrides: Partial<Record<NutrientKey, number>> = {};
  real.soil?.values.forEach((v) => {
    if (v.value !== null) overrides[v.key] = v.value;
  });

  const existing = db.analyses.find((a) => a.id === real.id);
  const shadow: MockAnalysis = {
    id: real.id,
    jobId: null,
    ownerId: existing?.ownerId ?? currentUserId(),
    createdAt: real.createdAt,
    pending: false,
    farmId: real.farmId,
    cropId: real.cropId,
    growthStage: real.growthStage,
    area: real.area,
    areaUnit: real.areaUnit,
    soilKey: null,
    soilCardUrl: real.soil?.cardImageUrl ?? null,
    soilWithRegions: false,
    soilSampleDate: real.soil?.sampleDate ?? null,
    soilOverrides: Object.keys(overrides).length ? overrides : null,
    soilConfirmed: real.soilConfirmed,
    leafKey,
    leafImageUrl: dx?.leafImageUrl ?? null,
    saved: existing?.saved ?? Boolean(real.saved),
  };
  db.analyses = [shadow, ...db.analyses.filter((a) => a.id !== real.id)];
  commit();
}

export function createServices(): Services {
  const mock = createMockServices();

  const advisory: AdvisoryService = {
    ...mock.advisory,
    getAdvisory: async (params) => {
      let real: AnalysisResult | null = null;
      try {
        real = await httpAnalysis.get(params.analysisId, params.lang);
      } catch (error) {
        // Not a real analysis (e.g. a seeded demo one): the mock engine owns it. Anything else is a real failure.
        if ((error as { code?: string }).code !== 'NOT_FOUND') throw error;
      }
      if (!real) return mock.advisory.getAdvisory(params);

      syncShadowAnalysis(real);
      const advice = await mock.advisory.getAdvisory(params);
      const dx = real.diagnosis;
      if (!dx) return advice;

      // The diagnosis shown is always the model's, whether or not a demo protocol matched.
      return {
        ...advice,
        // The mock crop list only has 3 crops; the real result already carries the right crop name.
        cropName: real.cropName,
        diseaseName: dx.name,
        isHealthy: dx.isHealthy,
        lowConfidence: dx.lowConfidence,
        chemicalUnavailableReason: advice.chemical ? null : dx.isHealthy ? 'healthy' : 'no_protocol',
      };
    },
  };

  // Offer every crop the model can read. The three mock crops keep their Hindi/Kannada names.
  const farms: Services['farms'] = {
    ...mock.farms,
    listCrops: async (lang) => {
      const [real, demo] = await Promise.all([httpListCrops(lang).catch(() => null), mock.farms.listCrops(lang)]);
      if (!real?.length) return demo; // backend down: fall back to the demo crops
      return real.map((c) => demo.find((d) => d.id === c.id) ?? c);
    },
  };

  return {
    ...mock,
    farms,
    uploads: httpUploads,
    analysis: httpAnalysis,
    advisory,
    // Bundled sample images are mock-only (SVGs the model cannot read).
    demo: {
      ...mock.demo,
      listSamples: () => Promise.resolve([]),
      listScenarios: () => Promise.resolve([]),
    },
  };
}
