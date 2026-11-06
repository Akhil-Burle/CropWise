import type { AreaUnit, ISODate, Localized } from './common';

export type SoilType =
  | 'red_sandy_loam'
  | 'red_loam'
  | 'black_cotton'
  | 'laterite'
  | 'alluvial'
  | 'clay_loam';

export const SOIL_TYPES: readonly SoilType[] = [
  'red_sandy_loam',
  'red_loam',
  'black_cotton',
  'laterite',
  'alluvial',
  'clay_loam',
] as const;

export interface Crop extends Localized {
  id: string;
  name: string;
  scientificName: string | null;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Farm {
  id: string;
  name: string;
  village: string;
  district: string;
  state: string;
  area: number;
  areaUnit: AreaUnit;
  cropIds: string[];
  soilType: SoilType | null;
  location: GeoPoint | null;
  lastSoilTestDate: ISODate | null;
}

export interface FarmInput {
  name: string;
  village: string;
  district: string;
  state: string;
  area: number;
  areaUnit: AreaUnit;
  cropIds: string[];
  soilType: SoilType | null;
}

export interface Region {
  state: string;
  districts: string[];
}

export type SeasonPhase = 'sowing' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest';

export interface SeasonTimelineItem extends Localized {
  id: string;
  phase: SeasonPhase;
  label: string;
  start: ISODate;
  end: ISODate;
  status: 'done' | 'current' | 'upcoming';
}
