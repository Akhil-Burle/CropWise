import type { AppError, AreaUnit, ISODate, PageParams, Lang } from './common';
import type { SoilReport } from './soil';
import type { DiseasePrediction } from './disease';

export type GrowthStage = 'vegetative' | 'flowering' | 'fruiting';
export const GROWTH_STAGES: readonly GrowthStage[] = ['vegetative', 'flowering', 'fruiting'] as const;

export type UploadKind = 'soil_card' | 'leaf';

export interface UploadRef {
  id: string;
  kind: UploadKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number | null;
  previewUrl: string | null;
  isSample: boolean;
}

export interface AnalysisInput {
  farmId: string;
  cropId: string;
  growthStage: GrowthStage;
  area: number;
  areaUnit: AreaUnit;
  soilUploadId: string | null;
  leafUploadId: string | null;
}

export type AnalysisStage = 'cleaning' | 'reading_soil' | 'analysing_leaf' | 'matching_protocols';
export const ANALYSIS_STAGES: readonly AnalysisStage[] = [
  'cleaning',
  'reading_soil',
  'analysing_leaf',
  'matching_protocols',
] as const;

export type PartStatus = 'ok' | 'failed' | 'skipped';

export type AnalysisJobStatus =
  | { state: 'queued'; position: number | null }
  | { state: 'processing'; stage: AnalysisStage; progress: number; completedStages: AnalysisStage[] }
  | { state: 'completed'; analysisId: string; parts: { soil: PartStatus; leaf: PartStatus } }
  | { state: 'failed'; error: AppError }
  | { state: 'cancelled' };

export interface AnalysisResult {
  id: string;
  createdAt: ISODate;
  farmId: string;
  farmName: string | null;
  cropId: string;
  cropName: string;
  growthStage: GrowthStage;
  area: number;
  areaUnit: AreaUnit;
  soil: SoilReport | null;
  soilError: AppError | null;
  diagnosis: DiseasePrediction | null;
  diagnosisError: AppError | null;
  soilConfirmed: boolean;
  saved: boolean;
}

export type AnalysisSummaryStatus = 'complete' | 'partial' | 'needs_review';

export interface AnalysisSummary {
  id: string;
  createdAt: ISODate;
  farmId: string;
  farmName: string | null;
  cropId: string;
  cropName: string;
  diseaseName: string | null;
  isHealthy: boolean | null;
  confidence: number | null;
  status: AnalysisSummaryStatus;
  saved: boolean;
}

export interface AnalysisListParams extends PageParams {
  lang: Lang;
  farmId?: string;
  cropId?: string;
  status?: AnalysisSummaryStatus;
}
