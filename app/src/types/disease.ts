import type { Localized } from './common';

export type Severity = 'none' | 'low' | 'moderate' | 'high';

export interface DiseaseAlternative {
  diseaseId: string | null;
  name: string;
  probability: number;
}

export interface DiseasePrediction extends Localized {
  id: string;
  cropId: string;
  /** Null when the leaf is healthy. */
  diseaseId: string | null;
  name: string;
  scientificName: string | null;
  isHealthy: boolean;
  /** 0–1. */
  confidence: number;
  /** Threshold the service used to flag low confidence (0–1). */
  confidenceThreshold: number;
  lowConfidence: boolean;
  alternatives: DiseaseAlternative[];
  description: string;
  symptoms: string[];
  /** Null when the model only classifies and does not estimate severity. */
  severity: Severity | null;
  affectedAreaPct: number | null;
  leafImageUrl: string | null;
}
