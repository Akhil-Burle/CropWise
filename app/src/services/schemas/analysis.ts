import { z } from 'zod';
import { AppErrorSchema, AreaUnitSchema, LangSchema } from './common';
import { SoilReportSchema } from './soil';

const StageSchema = z.enum(['cleaning', 'reading_soil', 'analysing_leaf', 'matching_protocols']);
const PartStatusSchema = z.enum(['ok', 'failed', 'skipped']);
export const GrowthStageSchema = z.enum(['vegetative', 'flowering', 'fruiting']);

export const JobRefSchema = z.object({ jobId: z.string() });

export const JobStatusSchema = z.discriminatedUnion('state', [
  z.object({ state: z.literal('queued'), position: z.number().int().nullish() }),
  z.object({
    state: z.literal('processing'),
    stage: StageSchema,
    progress: z.number().min(0).max(100),
    completedStages: z.array(StageSchema).nullish(),
  }),
  z.object({
    state: z.literal('completed'),
    analysisId: z.string(),
    parts: z.object({ soil: PartStatusSchema, leaf: PartStatusSchema }),
  }),
  z.object({ state: z.literal('failed'), error: AppErrorSchema }),
  z.object({ state: z.literal('cancelled') }),
]);

export const DiseasePredictionSchema = z.object({
  id: z.string(),
  cropId: z.string(),
  diseaseId: z.string().nullish(),
  name: z.string(),
  scientificName: z.string().nullish(),
  isHealthy: z.boolean(),
  confidence: z.number().min(0).max(1),
  confidenceThreshold: z.number().min(0).max(1).nullish(),
  lowConfidence: z.boolean().nullish(),
  alternatives: z
    .array(z.object({ diseaseId: z.string().nullish(), name: z.string(), probability: z.number().min(0).max(1) }))
    .nullish(),
  description: z.string().nullish(),
  symptoms: z.array(z.string()).nullish(),
  severity: z.enum(['none', 'low', 'moderate', 'high']).nullish(),
  affectedAreaPct: z.number().nullish(),
  leafImageUrl: z.string().nullish(),
  contentLang: LangSchema.nullish(),
});

export const AnalysisResultSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  farmId: z.string(),
  farmName: z.string().nullish(),
  cropId: z.string(),
  cropName: z.string(),
  growthStage: GrowthStageSchema,
  area: z.number().positive(),
  areaUnit: AreaUnitSchema,
  soil: SoilReportSchema.nullish(),
  soilError: AppErrorSchema.nullish(),
  diagnosis: DiseasePredictionSchema.nullish(),
  diagnosisError: AppErrorSchema.nullish(),
  soilConfirmed: z.boolean().nullish(),
  saved: z.boolean().nullish(),
});

export const AnalysisSummarySchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  farmId: z.string(),
  farmName: z.string().nullish(),
  cropId: z.string(),
  cropName: z.string(),
  diseaseName: z.string().nullish(),
  isHealthy: z.boolean().nullish(),
  confidence: z.number().nullish(),
  status: z.enum(['complete', 'partial', 'needs_review']),
  saved: z.boolean().nullish(),
});

export const UploadRefSchema = z.object({
  id: z.string(),
  kind: z.enum(['soil_card', 'leaf']),
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().nullish(),
  previewUrl: z.string().nullish(),
  isSample: z.boolean().nullish(),
});

export type JobStatusDto = z.infer<typeof JobStatusSchema>;
export type DiseasePredictionDto = z.infer<typeof DiseasePredictionSchema>;
export type AnalysisResultDto = z.infer<typeof AnalysisResultSchema>;
export type AnalysisSummaryDto = z.infer<typeof AnalysisSummarySchema>;
export type UploadRefDto = z.infer<typeof UploadRefSchema>;
