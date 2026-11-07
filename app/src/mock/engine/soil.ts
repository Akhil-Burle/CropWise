import type { Lang, NutrientKey, NutrientStatus, SoilComparisonRow, SoilValue } from '@/types';
import { NUTRIENT_KEYS } from '@/types';
import type { L } from '../data/localize';
import { translator } from '../data/localize';

/** Soil Health Card style ratings (available nutrients, kg/ha; pH; EC dS/m; OC %). */
interface Norm {
  unit: string;
  low: number | null;
  high: number | null;
  labels?: { low: L; mid: L; high: L };
  /** Status to use above `high` (OC above range is good, so it stays "sufficient"). */
  aboveStatus: NutrientStatus;
}

export const NORMS: Record<NutrientKey, Norm> = {
  N: { unit: 'kg/ha', low: 280, high: 560, aboveStatus: 'excess' },
  P: { unit: 'kg/ha', low: 10, high: 25, aboveStatus: 'excess' },
  K: { unit: 'kg/ha', low: 110, high: 280, aboveStatus: 'excess' },
  pH: {
    unit: '',
    low: 6.5,
    high: 7.5,
    aboveStatus: 'excess',
    labels: {
      low: { en: 'Acidic', hi: 'अम्लीय', kn: 'ಆಮ್ಲೀಯ' },
      mid: { en: 'Neutral', hi: 'उदासीन', kn: 'ತಟಸ್ಥ' },
      high: { en: 'Alkaline', hi: 'क्षारीय', kn: 'ಕ್ಷಾರೀಯ' },
    },
  },
  EC: {
    unit: 'dS/m',
    low: null,
    high: 1.0,
    aboveStatus: 'excess',
    labels: {
      low: { en: 'Normal', hi: 'सामान्य', kn: 'ಸಾಮಾನ್ಯ' },
      mid: { en: 'Normal', hi: 'सामान्य', kn: 'ಸಾಮಾನ್ಯ' },
      high: { en: 'High salinity', hi: 'अधिक लवणता', kn: 'ಹೆಚ್ಚು ಲವಣಾಂಶ' },
    },
  },
  OC: {
    unit: '%',
    low: 0.5,
    high: 0.75,
    aboveStatus: 'sufficient',
    labels: {
      low: { en: 'Low', hi: 'कम', kn: 'ಕಡಿಮೆ' },
      mid: { en: 'Medium', hi: 'मध्यम', kn: 'ಮಧ್ಯಮ' },
      high: { en: 'High', hi: 'अधिक', kn: 'ಹೆಚ್ಚು' },
    },
  },
};

export function classify(key: NutrientKey, value: number, lang: Lang): { status: NutrientStatus; label: string | null } {
  const n = NORMS[key];
  const { t } = translator(lang);
  if (n.low !== null && value < n.low) return { status: 'deficient', label: n.labels ? t(n.labels.low) : null };
  if (n.high !== null && value > n.high) return { status: n.aboveStatus, label: n.labels ? t(n.labels.high) : null };
  return { status: 'sufficient', label: n.labels ? t(n.labels.mid) : null };
}

/** Raw reading as it comes off a card (mock OCR output). */
export interface RawReading {
  key: NutrientKey;
  value: number | null;
  confidence: number | null;
}

export const REVIEW_THRESHOLD = 0.75;

/** Row index of each parameter on the sample Soil Health Card SVGs (see public/samples). */
const CARD_ROW: Record<NutrientKey, number> = { pH: 0, EC: 1, OC: 2, N: 3, P: 4, K: 5 };

export function cardRegion(key: NutrientKey) {
  const row = CARD_ROW[key];
  return { x: 0.52, y: (472 + row * 54) / 1100, w: 0.2, h: 50 / 1100 };
}

export function buildSoilValues(readings: RawReading[], lang: Lang, withRegions: boolean): SoilValue[] {
  return NUTRIENT_KEYS.map((key) => {
    const r = readings.find((x) => x.key === key);
    const value = r?.value ?? null;
    const norm = NORMS[key];
    const c = value !== null ? classify(key, value, lang) : null;
    const confidence = r?.confidence ?? null;
    return {
      key,
      value,
      unit: norm.unit,
      status: c?.status ?? null,
      statusLabel: c?.label ?? null,
      range: { low: norm.low, high: norm.high },
      confidence,
      needsReview: value === null || (confidence !== null && confidence < REVIEW_THRESHOLD),
      reviewReason: value === null ? 'not_found' : confidence !== null && confidence < REVIEW_THRESHOLD ? 'low_confidence' : null,
      region: withRegions ? cardRegion(key) : null,
    };
  });
}

/** Distance outside the healthy band, normalised – used to judge improvement. */
function badness(key: NutrientKey, value: number): number {
  const n = NORMS[key];
  if (n.low !== null && value < n.low) return (n.low - value) / n.low;
  if (n.high !== null && value > n.high && n.aboveStatus === 'excess') return (value - n.high) / n.high;
  return 0;
}

export function compareValue(key: NutrientKey, a: number | null, b: number | null, lang: Lang): SoilComparisonRow {
  const unit = NORMS[key].unit;
  if (a === null || b === null) {
    return { key, unit, a, b, delta: null, statusA: null, statusB: null, improved: null };
  }
  const delta = Math.round((b - a) * 100) / 100;
  const ba = badness(key, a);
  const bb = badness(key, b);
  return {
    key,
    unit,
    a,
    b,
    delta,
    statusA: classify(key, a, lang).status,
    statusB: classify(key, b, lang).status,
    improved: ba === bb ? (ba === 0 ? true : null) : bb < ba,
  };
}
