/**
 * Mappers convert validated wire DTOs into the app's domain model.
 * If a real backend's response shape differs, only these functions (and the schemas) change.
 */
import type { z } from 'zod';
import type {
  AdminAnalytics,
  AdvisoryReport,
  AnalysisJobStatus,
  AnalysisResult,
  AnalysisSummary,
  AppError,
  AppErrorCode,
  Article,
  ArticleSummary,
  ChatMessage,
  Crop,
  DataExport,
  DemoAccount,
  DemoScenario,
  DiseasePrediction,
  DualAdvisory,
  ExpertNote,
  FarmerDetail,
  ReviewItem,
  Farm,
  FarmerSummary,
  GlossaryTerm,
  HarvestSafeResult,
  Helpline,
  Lang,
  MythFact,
  OtpChallenge,
  Paginated,
  PhiAlert,
  Profile,
  QuizAnswerResult,
  QuizQuestion,
  Region,
  RuleEntry,
  SampleAsset,
  SeasonTask,
  SeasonTimelineItem,
  Session,
  ShareMessage,
  SoilComparison,
  SoilReport,
  SoilTrend,
  SoilValue,
  TransitionPlan,
  Treatment,
  UploadRef,
  User,
  WeatherReport,
} from '@/types';
import type * as S from '../schemas';
import { appError } from '../errors';

type Infer<T extends z.ZodTypeAny> = z.infer<T>;

const KNOWN_CODES: ReadonlySet<string> = new Set<AppErrorCode>([
  'NETWORK', 'TIMEOUT', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'VALIDATION', 'INVALID_RESPONSE',
  'UPLOAD_FAILED', 'FILE_TOO_LARGE', 'FILE_TYPE', 'UNREADABLE_SOIL_CARD', 'LEAF_NOT_DETECTED',
  'CANCELLED', 'OTP_INVALID', 'OTP_EXPIRED', 'RATE_LIMITED', 'NOT_IMPLEMENTED', 'SERVER', 'UNKNOWN',
]);

const lang = (value: Lang | null | undefined): Lang => value ?? 'en';

export function toAppErrorFromDto(dto: S.AppErrorDto): AppError {
  const code = (KNOWN_CODES.has(dto.code) ? dto.code : 'UNKNOWN') as AppErrorCode;
  return appError(code, dto.message ?? undefined, {
    retryable: dto.retryable ?? undefined,
    fieldErrors: dto.fieldErrors ?? undefined,
  });
}

export function toPage<D, T>(dto: { items: D[]; page?: number | null; pageSize?: number | null; total?: number | null; hasMore?: boolean | null }, map: (d: D) => T): Paginated<T> {
  const items = dto.items.map(map);
  const page = dto.page ?? 1;
  const pageSize = dto.pageSize ?? items.length;
  const total = dto.total ?? null;
  return {
    items,
    page,
    pageSize,
    total,
    hasMore: dto.hasMore ?? (total !== null ? page * pageSize < total : false),
  };
}

/* ---------- Users ---------- */

export const toUser = (d: S.UserDto): User => ({
  id: d.id,
  name: d.name,
  phone: d.phone,
  roles: d.roles,
  village: d.village ?? null,
  district: d.district ?? null,
  state: d.state ?? null,
  preferredLang: d.preferredLang ?? null,
});

export const toSession = (d: S.SessionDto): Session => ({ user: toUser(d.user), expiresAt: d.expiresAt ?? null });

export const toOtpChallenge = (d: S.OtpChallengeDto): OtpChallenge => ({
  challengeId: d.challengeId,
  phoneMasked: d.phoneMasked,
  expiresInSec: d.expiresInSec,
  resendInSec: d.resendInSec ?? 30,
  demoCode: d.demoCode ?? null,
});

export const toDemoAccount = (d: S.DemoAccountDto): DemoAccount => ({
  id: d.id,
  name: d.name,
  role: d.role,
  description: d.description ?? '',
});

export const toProfile = (d: S.ProfileDto): Profile => ({ user: toUser(d.user), notifications: d.notifications });
export const toDataExport = (d: S.DataExportDto): DataExport => d;

/* ---------- Farms ---------- */

export const toFarm = (d: S.FarmDto): Farm => ({
  id: d.id,
  name: d.name,
  village: d.village ?? '',
  district: d.district,
  state: d.state,
  area: d.area,
  areaUnit: d.areaUnit ?? 'acre',
  cropIds: d.cropIds ?? [],
  soilType: d.soilType ?? null,
  location: d.location ?? null,
  lastSoilTestDate: d.lastSoilTestDate ?? null,
});

export const toCrop = (d: S.CropDto): Crop => ({
  id: d.id,
  name: d.name,
  scientificName: d.scientificName ?? null,
  contentLang: lang(d.contentLang),
});

export const toRegion = (d: S.RegionDto): Region => d;

export const toSeasonItem = (d: S.SeasonTimelineItemDto): SeasonTimelineItem => ({
  ...d,
  contentLang: lang(d.contentLang),
});

/* ---------- Soil ---------- */

export const toSoilValue = (d: S.SoilValueDto): SoilValue => ({
  key: d.key,
  value: d.value ?? null,
  unit: d.unit,
  status: d.status ?? null,
  statusLabel: d.statusLabel ?? null,
  range: { low: d.range?.low ?? null, high: d.range?.high ?? null },
  confidence: d.confidence ?? null,
  needsReview: d.needsReview ?? false,
  region: d.region ?? null,
});

export const toSoilReport = (d: S.SoilReportDto): SoilReport => ({
  id: d.id,
  farmId: d.farmId,
  sampleDate: d.sampleDate ?? null,
  labName: d.labName ?? null,
  cardImageUrl: d.cardImageUrl ?? null,
  source: d.source ?? 'ocr',
  confirmed: d.confirmed ?? false,
  values: d.values.map(toSoilValue),
});

export const toSoilTrend = (d: S.SoilTrendDto): SoilTrend => ({
  farmId: d.farmId,
  series: d.series.map((s) => ({
    key: s.key,
    unit: s.unit,
    range: { low: s.range?.low ?? null, high: s.range?.high ?? null },
    points: s.points,
  })),
});

export const toSoilComparison = (d: S.SoilComparisonDto): SoilComparison => ({
  a: toSoilReport(d.a),
  b: toSoilReport(d.b),
  rows: d.rows.map((r) => ({
    key: r.key,
    unit: r.unit,
    a: r.a ?? null,
    b: r.b ?? null,
    delta: r.delta ?? null,
    statusA: r.statusA ?? null,
    statusB: r.statusB ?? null,
    improved: r.improved ?? null,
  })),
});

/* ---------- Analysis ---------- */

export const toUploadRef = (d: S.UploadRefDto): UploadRef => ({
  id: d.id,
  kind: d.kind,
  fileName: d.fileName,
  mimeType: d.mimeType,
  sizeBytes: d.sizeBytes ?? null,
  previewUrl: d.previewUrl ?? null,
  isSample: d.isSample ?? false,
});

export const toJobRef = (d: Infer<typeof S.JobRefSchema>): { jobId: string } => ({ jobId: d.jobId });

export const toJobStatus = (d: S.JobStatusDto): AnalysisJobStatus => {
  switch (d.state) {
    case 'queued':
      return { state: 'queued', position: d.position ?? null };
    case 'processing':
      return { state: 'processing', stage: d.stage, progress: d.progress, completedStages: d.completedStages ?? [] };
    case 'completed':
      return { state: 'completed', analysisId: d.analysisId, parts: d.parts };
    case 'failed':
      return { state: 'failed', error: toAppErrorFromDto(d.error) };
    case 'cancelled':
      return { state: 'cancelled' };
  }
};

export const toDiagnosis = (d: S.DiseasePredictionDto): DiseasePrediction => {
  const threshold = d.confidenceThreshold ?? 0.7;
  return {
    id: d.id,
    cropId: d.cropId,
    diseaseId: d.diseaseId ?? null,
    name: d.name,
    scientificName: d.scientificName ?? null,
    isHealthy: d.isHealthy,
    confidence: d.confidence,
    confidenceThreshold: threshold,
    lowConfidence: d.lowConfidence ?? d.confidence < threshold,
    alternatives: (d.alternatives ?? []).map((a) => ({
      diseaseId: a.diseaseId ?? null,
      name: a.name,
      probability: a.probability,
    })),
    description: d.description ?? '',
    symptoms: d.symptoms ?? [],
    severity: d.severity ?? 'none',
    affectedAreaPct: d.affectedAreaPct ?? null,
    leafImageUrl: d.leafImageUrl ?? null,
    contentLang: lang(d.contentLang),
  };
};

export const toAnalysisResult = (d: S.AnalysisResultDto): AnalysisResult => ({
  id: d.id,
  createdAt: d.createdAt,
  farmId: d.farmId,
  farmName: d.farmName ?? null,
  cropId: d.cropId,
  cropName: d.cropName,
  growthStage: d.growthStage,
  area: d.area,
  areaUnit: d.areaUnit,
  soil: d.soil ? toSoilReport(d.soil) : null,
  soilError: d.soilError ? toAppErrorFromDto(d.soilError) : null,
  diagnosis: d.diagnosis ? toDiagnosis(d.diagnosis) : null,
  diagnosisError: d.diagnosisError ? toAppErrorFromDto(d.diagnosisError) : null,
  soilConfirmed: d.soilConfirmed ?? false,
  saved: d.saved ?? false,
});

export const toAnalysisSummary = (d: S.AnalysisSummaryDto): AnalysisSummary => ({
  id: d.id,
  createdAt: d.createdAt,
  farmId: d.farmId,
  farmName: d.farmName ?? null,
  cropId: d.cropId,
  cropName: d.cropName,
  diseaseName: d.diseaseName ?? null,
  isHealthy: d.isHealthy ?? null,
  confidence: d.confidence ?? null,
  status: d.status,
  saved: d.saved ?? false,
});

/* ---------- Advisory ---------- */

export const toAdvisory = (d: S.DualAdvisoryDto): DualAdvisory => ({
  id: d.id,
  analysisId: d.analysisId,
  cropName: d.cropName,
  diseaseName: d.diseaseName ?? null,
  isHealthy: d.isHealthy,
  lowConfidence: d.lowConfidence ?? false,
  area: d.area,
  areaUnit: d.areaUnit,
  chemical: d.chemical
    ? {
        productName: d.chemical.productName ?? null,
        activeIngredient: d.chemical.activeIngredient,
        formulation: d.chemical.formulation,
        dose: d.chemical.dose,
        water: d.chemical.water,
        tank: d.chemical.tank ?? null,
        toxicity: {
          class: d.chemical.toxicity.class,
          label: d.chemical.toxicity.label,
          description: d.chemical.toxicity.description ?? '',
        },
        phiDays: d.chemical.phiDays,
        reentryHours: d.chemical.reentryHours ?? null,
        sprayTiming: d.chemical.sprayTiming ?? '',
        maxApplications: d.chemical.maxApplications ?? null,
        intervalDays: d.chemical.intervalDays ?? null,
        ppe: d.chemical.ppe.map((p) => ({ ...p, required: p.required ?? true })),
        storage: d.chemical.storage ?? [],
        disposal: d.chemical.disposal ?? [],
        firstAid: d.chemical.firstAid ?? [],
        warnings: d.chemical.warnings ?? [],
        complianceNote: d.chemical.complianceNote,
        rotationNote: d.chemical.rotationNote ?? null,
        requiresAcknowledgement: d.chemical.requiresAcknowledgement ?? true,
      }
    : null,
  chemicalUnavailableReason: d.chemicalUnavailableReason ?? null,
  organic: {
    agents: d.organic.agents,
    effectiveness: d.organic.effectiveness,
    recipes: (d.organic.recipes ?? []).map((r) => ({ ...r, caution: r.caution ?? null })),
    traps: (d.organic.traps ?? []).map((t) => ({ ...t, perArea: t.perArea ?? null })),
    companionCrops: d.organic.companionCrops ?? [],
    amendments: d.organic.amendments ?? [],
    culturalPractices: d.organic.culturalPractices ?? [],
  },
  cost: {
    currency: d.cost.currency,
    chemical: d.cost.chemical ?? null,
    organic: d.cost.organic,
    note: d.cost.note ?? '',
  },
  rationale: d.rationale ?? [],
  disclaimer: d.disclaimer,
  saved: d.saved ?? false,
  generatedAt: d.generatedAt,
  contentLang: lang(d.contentLang),
});

export const toAdvisoryReport = (d: S.AdvisoryReportDto): AdvisoryReport => d;
export const toShareMessage = (d: Infer<typeof S.ShareMessageSchema>): ShareMessage => d;
export const toSaved = (d: Infer<typeof S.SavedSchema>): { saved: boolean } => d;

/* ---------- Transition & treatments ---------- */

export const toSeasonTask = (d: S.SeasonTaskDto): SeasonTask => d;

export const toTransitionPlan = (d: S.TransitionPlanDto): TransitionPlan => ({
  ...d,
  breakEven: d.breakEven ?? null,
  socTargetReachedLabel: d.socTargetReachedLabel ?? null,
  seasons: d.seasons.map((s) => ({ ...s, tasks: s.tasks.map(toSeasonTask) })),
  assumptions: d.assumptions ?? [],
  contentLang: lang(d.contentLang),
});

export const toTreatment = (d: S.TreatmentDto): Treatment => ({
  id: d.id,
  farmId: d.farmId,
  farmName: d.farmName ?? null,
  cropName: d.cropName ?? null,
  type: d.type,
  title: d.title,
  product: d.product,
  dose: d.dose ?? null,
  scheduledDate: d.scheduledDate,
  doneDate: d.doneDate ?? null,
  phiDays: d.phiDays ?? null,
  harvestSafeDate: d.harvestSafeDate ?? null,
  daysToSafe: d.daysToSafe ?? null,
  status: d.status,
  reminder: d.reminder ?? false,
  analysisId: d.analysisId ?? null,
  notes: d.notes ?? null,
});

export const toHarvestSafe = (d: Infer<typeof S.HarvestSafeSchema>): HarvestSafeResult => d;
export const toPhiAlert = (d: Infer<typeof S.PhiAlertSchema>): PhiAlert => d;

/* ---------- Content ---------- */

export const toArticleSummary = (d: S.ArticleSummaryDto): ArticleSummary => ({
  id: d.id,
  title: d.title,
  summary: d.summary,
  category: d.category,
  readMinutes: d.readMinutes ?? 3,
  level: d.level ?? 'beginner',
  tone: d.tone ?? 'forest',
  bookmarked: d.bookmarked ?? false,
  contentLang: lang(d.contentLang),
});

export const toArticle = (d: S.ArticleDto): Article => ({
  ...toArticleSummary(d),
  blocks: d.blocks,
  updatedAt: d.updatedAt,
  source: d.source ?? null,
});

export const toGlossaryTerm = (d: Infer<typeof S.GlossaryTermSchema>): GlossaryTerm => ({
  ...d,
  contentLang: lang(d.contentLang),
});

export const toMythFact = (d: Infer<typeof S.MythFactSchema>): MythFact => ({ ...d, contentLang: lang(d.contentLang) });

export const toQuizQuestion = (d: Infer<typeof S.QuizQuestionSchema>): QuizQuestion => ({
  ...d,
  contentLang: lang(d.contentLang),
});

export const toQuizAnswer = (d: Infer<typeof S.QuizAnswerSchema>): QuizAnswerResult => d;
export const toBookmark = (d: Infer<typeof S.BookmarkSchema>): { bookmarked: boolean } => d;

export const toChatMessage = (d: S.ChatMessageDto): ChatMessage => ({ ...d, suggestions: d.suggestions ?? [] });

export const toHelpline = (d: S.HelplineDto): Helpline => ({
  ...d,
  isDemo: d.isDemo ?? false,
  contentLang: lang(d.contentLang),
});

export const toWeather = (d: S.WeatherDto): WeatherReport => ({
  ...d,
  isDemo: d.isDemo ?? false,
  contentLang: lang(d.contentLang),
});

export const toSampleAsset = (d: Infer<typeof S.SampleAssetSchema>): SampleAsset => d;
export const toDemoScenario = (d: Infer<typeof S.DemoScenarioSchema>): DemoScenario => d;

/* ---------- Admin ---------- */

export const toFarmerSummary = (d: S.FarmerSummaryDto): FarmerSummary => ({
  ...d,
  lastAnalysisAt: d.lastAnalysisAt ?? null,
});

export const toAdminAnalytics = (d: S.AdminAnalyticsDto): AdminAnalytics => ({ ...d, isDemo: d.isDemo ?? false });
export const toRuleEntry = (d: S.RuleEntryDto): RuleEntry => d;

/* ---------- Expert ---------- */

export const toExpertNote = (d: S.ExpertNoteDto): ExpertNote => ({
  ...d,
  analysisId: d.analysisId ?? null,
  read: d.read ?? false,
});

export const toReviewItem = (d: S.ReviewItemDto): ReviewItem => ({
  ...d,
  diseaseName: d.diseaseName ?? null,
  confidence: d.confidence ?? null,
});

export const toFarmerDetail = (d: S.FarmerDetailDto): FarmerDetail => ({
  farmer: toFarmerSummary(d.farmer),
  farms: d.farms,
  analyses: d.analyses.map(toAnalysisSummary),
  treatments: d.treatments.map(toTreatment),
  notes: d.notes.map(toExpertNote),
});
