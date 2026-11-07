import type { ISODate } from './common';

export type NutrientKey = 'N' | 'P' | 'K' | 'pH' | 'EC' | 'OC';
export const NUTRIENT_KEYS: readonly NutrientKey[] = ['N', 'P', 'K', 'pH', 'EC', 'OC'] as const;

export type NutrientStatus = 'deficient' | 'sufficient' | 'excess';

export interface NutrientRange {
  low: number | null;
  high: number | null;
}

/** Fractions (0–1) of the card image, so the UI can draw highlights at any size. */
export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SoilValue {
  key: NutrientKey;
  value: number | null;
  unit: string;
  status: NutrientStatus | null;
  /** Optional human label from the service, e.g. "Acidic" for a low pH. */
  statusLabel: string | null;
  range: NutrientRange;
  /** OCR confidence 0–1, null for manual/lab entries. */
  confidence: number | null;
  needsReview: boolean;
  /** Why the farmer should check this field (not_found, unreadable, unit_converted, ...), else null. */
  reviewReason: string | null;
  region: BoundingBox | null;
}

export interface SoilReport {
  id: string;
  farmId: string;
  sampleDate: ISODate | null;
  labName: string | null;
  cardImageUrl: string | null;
  source: 'ocr' | 'manual' | 'lab';
  confirmed: boolean;
  values: SoilValue[];
}

export interface SoilValueInput {
  key: NutrientKey;
  value: number;
}

export interface SoilTrendSeries {
  key: NutrientKey;
  unit: string;
  range: NutrientRange;
  points: { date: ISODate; value: number }[];
}

export interface SoilTrend {
  farmId: string;
  series: SoilTrendSeries[];
}

export interface SoilComparisonRow {
  key: NutrientKey;
  unit: string;
  a: number | null;
  b: number | null;
  delta: number | null;
  statusA: NutrientStatus | null;
  statusB: NutrientStatus | null;
  /** True when B moved toward the healthy range. Null when it cannot be judged. */
  improved: boolean | null;
}

export interface SoilComparison {
  a: SoilReport;
  b: SoilReport;
  rows: SoilComparisonRow[];
}
