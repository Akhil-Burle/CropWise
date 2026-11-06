import type { ISODate, Lang, PageParams } from './common';

export type AdoptionLevel = 'chemical' | 'organic' | 'mixed' | 'none';

export interface FarmerSummary {
  id: string;
  name: string;
  phone: string;
  village: string;
  district: string;
  state: string;
  farmCount: number;
  totalArea: number;
  lastAnalysisAt: ISODate | null;
  adoption: AdoptionLevel;
}

export interface FarmerListParams extends PageParams {
  district?: string;
  adoption?: AdoptionLevel;
}

export interface AdminAnalytics {
  totals: { farmers: number; analyses: number; advisoriesSaved: number; organicAdoptionPct: number };
  byDisease: { name: string; count: number }[];
  byDistrict: { district: string; count: number }[];
  adoption: { key: AdoptionLevel; value: number }[];
  monthly: { month: string; analyses: number; organicActions: number }[];
  isDemo: boolean;
}

export interface RuleEntry {
  id: string;
  type: 'chemical' | 'organic';
  cropName: string;
  diseaseName: string;
  title: string;
  summary: string;
  details: { label: string; value: string }[];
  source: string;
  updatedAt: ISODate;
}

export interface RuleListParams extends PageParams {
  lang: Lang;
  type?: 'chemical' | 'organic';
  cropId?: string;
}

export interface FarmerDetail {
  farmer: FarmerSummary;
  farms: { id: string; name: string; village: string; area: number; cropNames: string[] }[];
  /** Newest first. Uses the same summary shape as the farmer's own Reports list. */
  analyses: import('./analysis').AnalysisSummary[];
  treatments: import('./treatment').Treatment[];
  notes: ExpertNote[];
}

export interface ReviewItem {
  analysisId: string;
  farmerId: string;
  farmerName: string;
  village: string;
  cropName: string;
  diseaseName: string | null;
  confidence: number | null;
  reason: 'low_confidence' | 'soil_unconfirmed' | 'partial';
  createdAt: ISODate;
}

/** Advice an agronomist sends to a farmer. Shown on the farmer's home screen. */
export interface ExpertNote {
  id: string;
  farmerId: string;
  analysisId: string | null;
  fromName: string;
  text: string;
  createdAt: ISODate;
  read: boolean;
}

export interface SendAdviceInput {
  farmerId: string;
  analysisId: string | null;
  text: string;
}
