import type { AreaUnit, GrowthStage, Quantity } from '@/types';

export const ACRES_PER_HECTARE = 2.471;

export const toAcres = (area: number, unit: AreaUnit): number => (unit === 'hectare' ? area * ACRES_PER_HECTARE : area);

/** Multiplier to express a per-acre figure per the user's area unit. */
export const perUnitFactor = (unit: AreaUnit): number => (unit === 'hectare' ? ACRES_PER_HECTARE : 1);

/** Spray volume rises with canopy size. */
export const STAGE_WATER_FACTOR: Record<GrowthStage, number> = {
  vegetative: 0.7,
  flowering: 0.85,
  fruiting: 1,
};

export const KNAPSACK_L = 16;

function roundSmart(value: number): number {
  if (value >= 1000) return Math.round(value / 10) * 10;
  if (value >= 100) return Math.round(value / 5) * 5;
  if (value >= 10) return Math.round(value);
  return Math.round(value * 10) / 10;
}

/** Normalise a mass/volume into the most readable unit (g→kg, kg→t, ml→L). */
export function quantity(value: number, unit: string): Quantity {
  if (unit === 'g' && value >= 1000) return { value: Math.round((value / 1000) * 100) / 100, unit: 'kg' };
  if (unit === 'ml' && value >= 1000) return { value: Math.round((value / 1000) * 100) / 100, unit: 'L' };
  if (unit === 'kg' && value >= 1000) return { value: Math.round((value / 1000) * 10) / 10, unit: 't' };
  return { value: roundSmart(value), unit };
}

/** Dose per user area-unit and total for the entered area, from a per-acre figure. */
export function doseFromPerAcre(perAcre: number, unit: string, area: number, areaUnit: AreaUnit) {
  const acres = toAcres(area, areaUnit);
  return {
    perArea: quantity(perAcre * perUnitFactor(areaUnit), unit),
    total: quantity(perAcre * acres, unit),
  };
}

export const roundMoney = (inr: number): number => Math.round(inr / 10) * 10;
