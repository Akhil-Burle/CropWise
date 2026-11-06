import { z } from 'zod';
import { LangSchema } from './common';

/* ---------- Transition plan ---------- */

export const SeasonTaskSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: z.enum(['soil', 'bio', 'chemical', 'monitoring', 'market']),
  done: z.boolean(),
});

export const TransitionPlanSchema = z.object({
  id: z.string(),
  farmId: z.string(),
  speed: z.enum(['conservative', 'balanced', 'aggressive']),
  currency: z.string(),
  years: z.array(
    z.object({
      year: z.number().int(),
      title: z.string(),
      chemicalPct: z.number().min(0).max(100),
      organicPct: z.number().min(0).max(100),
      focus: z.array(z.string()),
    }),
  ),
  roi: z.array(z.object({ label: z.string(), chemical: z.number(), organic: z.number(), difference: z.number() })),
  breakEven: z.object({ index: z.number().int(), label: z.string() }).nullish(),
  yieldCurve: z.array(z.object({ label: z.string(), chemical: z.number(), transition: z.number() })),
  maxYieldDipPct: z.number(),
  soc: z.array(z.object({ label: z.string(), value: z.number() })),
  socStart: z.number(),
  socTarget: z.number(),
  socTargetReachedLabel: z.string().nullish(),
  seasons: z.array(
    z.object({ id: z.string(), label: z.string(), current: z.boolean(), tasks: z.array(SeasonTaskSchema) }),
  ),
  thisSeason: z.object({
    title: z.string(),
    chemicalPct: z.number(),
    organicPct: z.number(),
    changes: z.array(z.string()),
  }),
  assumptions: z.array(z.string()).nullish(),
  contentLang: LangSchema.nullish(),
});

/* ---------- Treatments ---------- */

export const TreatmentSchema = z.object({
  id: z.string(),
  farmId: z.string(),
  farmName: z.string().nullish(),
  cropName: z.string().nullish(),
  type: z.enum(['chemical', 'organic']),
  title: z.string(),
  product: z.string(),
  dose: z.string().nullish(),
  scheduledDate: z.string(),
  doneDate: z.string().nullish(),
  phiDays: z.number().int().nullish(),
  harvestSafeDate: z.string().nullish(),
  daysToSafe: z.number().int().nullish(),
  status: z.enum(['scheduled', 'done', 'overdue', 'skipped']),
  reminder: z.boolean().nullish(),
  analysisId: z.string().nullish(),
  notes: z.string().nullish(),
});

export const HarvestSafeSchema = z.object({
  safeDate: z.string(),
  daysRemaining: z.number().int(),
  isSafeToday: z.boolean(),
});

export const PhiAlertSchema = z.object({
  treatmentId: z.string(),
  farmName: z.string(),
  cropName: z.string(),
  product: z.string(),
  safeDate: z.string(),
  daysRemaining: z.number().int(),
});

export type TransitionPlanDto = z.infer<typeof TransitionPlanSchema>;
export type SeasonTaskDto = z.infer<typeof SeasonTaskSchema>;
export type TreatmentDto = z.infer<typeof TreatmentSchema>;

/** Farmer detail combines several shapes; it lives here to reuse the treatment schema. */
import { AnalysisSummarySchema } from './analysis';
import { ExpertNoteSchema, FarmerSummarySchema } from './content';

export const FarmerDetailSchema = z.object({
  farmer: FarmerSummarySchema,
  farms: z.array(z.object({ id: z.string(), name: z.string(), village: z.string(), area: z.number(), cropNames: z.array(z.string()) })),
  analyses: z.array(AnalysisSummarySchema),
  treatments: z.array(TreatmentSchema),
  notes: z.array(ExpertNoteSchema),
});
export type FarmerDetailDto = z.infer<typeof FarmerDetailSchema>;
