import { z } from 'zod';
import { AreaUnitSchema, LangSchema } from './common';

export const SoilTypeSchema = z.enum(['red_sandy_loam', 'red_loam', 'black_cotton', 'laterite', 'alluvial', 'clay_loam']);

export const FarmSchema = z.object({
  id: z.string(),
  name: z.string(),
  village: z.string().nullish(),
  district: z.string(),
  state: z.string(),
  area: z.number().positive(),
  areaUnit: AreaUnitSchema.nullish(),
  cropIds: z.array(z.string()).nullish(),
  soilType: SoilTypeSchema.nullish(),
  location: z.object({ lat: z.number(), lng: z.number() }).nullish(),
  lastSoilTestDate: z.string().nullish(),
});

export const CropSchema = z.object({
  id: z.string(),
  name: z.string(),
  scientificName: z.string().nullish(),
  contentLang: LangSchema.nullish(),
});

export const RegionSchema = z.object({
  state: z.string(),
  districts: z.array(z.string()),
});

export const SeasonTimelineItemSchema = z.object({
  id: z.string(),
  phase: z.enum(['sowing', 'vegetative', 'flowering', 'fruiting', 'harvest']),
  label: z.string(),
  start: z.string(),
  end: z.string(),
  status: z.enum(['done', 'current', 'upcoming']),
  contentLang: LangSchema.nullish(),
});

export type FarmDto = z.infer<typeof FarmSchema>;
export type CropDto = z.infer<typeof CropSchema>;
export type RegionDto = z.infer<typeof RegionSchema>;
export type SeasonTimelineItemDto = z.infer<typeof SeasonTimelineItemSchema>;
