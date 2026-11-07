import { z } from 'zod';

export const NutrientKeySchema = z.enum(['N', 'P', 'K', 'pH', 'EC', 'OC']);
export const NutrientStatusSchema = z.enum(['deficient', 'sufficient', 'excess']);

const RangeSchema = z.object({ low: z.number().nullish(), high: z.number().nullish() });

export const SoilValueSchema = z.object({
  key: NutrientKeySchema,
  value: z.number().finite().nullish(),
  unit: z.string(),
  status: NutrientStatusSchema.nullish(),
  statusLabel: z.string().nullish(),
  range: RangeSchema.nullish(),
  confidence: z.number().min(0).max(1).nullish(),
  needsReview: z.boolean().nullish(),
  reviewReason: z.string().nullish(),
  region: z
    .object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() })
    .nullish(),
});

export const SoilReportSchema = z.object({
  id: z.string(),
  farmId: z.string(),
  sampleDate: z.string().nullish(),
  labName: z.string().nullish(),
  cardImageUrl: z.string().nullish(),
  source: z.enum(['ocr', 'manual', 'lab']).nullish(),
  confirmed: z.boolean().nullish(),
  values: z.array(SoilValueSchema),
});

export const SoilTrendSchema = z.object({
  farmId: z.string(),
  series: z.array(
    z.object({
      key: NutrientKeySchema,
      unit: z.string(),
      range: RangeSchema.nullish(),
      points: z.array(z.object({ date: z.string(), value: z.number() })),
    }),
  ),
});

export const SoilComparisonSchema = z.object({
  a: SoilReportSchema,
  b: SoilReportSchema,
  rows: z.array(
    z.object({
      key: NutrientKeySchema,
      unit: z.string(),
      a: z.number().nullish(),
      b: z.number().nullish(),
      delta: z.number().nullish(),
      statusA: NutrientStatusSchema.nullish(),
      statusB: NutrientStatusSchema.nullish(),
      improved: z.boolean().nullish(),
    }),
  ),
});

export type SoilValueDto = z.infer<typeof SoilValueSchema>;
export type SoilReportDto = z.infer<typeof SoilReportSchema>;
export type SoilTrendDto = z.infer<typeof SoilTrendSchema>;
export type SoilComparisonDto = z.infer<typeof SoilComparisonSchema>;
