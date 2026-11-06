import { z } from 'zod';
import { AreaUnitSchema, DoseSchema, LangSchema, QuantitySchema } from './common';
import { NutrientKeySchema, NutrientStatusSchema } from './soil';

export const ToxicityClassSchema = z.enum(['red', 'yellow', 'blue', 'green']);

export const ChemicalAdvisorySchema = z.object({
  productName: z.string().nullish(),
  activeIngredient: z.string(),
  formulation: z.string(),
  dose: DoseSchema,
  water: DoseSchema,
  tank: z
    .object({ tankSizeL: z.number().positive(), tankCount: z.number().int().positive(), dosePerTank: QuantitySchema })
    .nullish(),
  toxicity: z.object({ class: ToxicityClassSchema, label: z.string(), description: z.string().nullish() }),
  phiDays: z.number().int().nonnegative(),
  reentryHours: z.number().nullish(),
  sprayTiming: z.string().nullish(),
  maxApplications: z.number().int().nullish(),
  intervalDays: z.number().int().nullish(),
  ppe: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      icon: z.enum(['gloves', 'mask', 'goggles', 'coverall', 'boots', 'cap']),
      required: z.boolean().nullish(),
    }),
  ),
  storage: z.array(z.string()).nullish(),
  disposal: z.array(z.string()).nullish(),
  firstAid: z.array(z.string()).nullish(),
  warnings: z.array(z.string()).nullish(),
  complianceNote: z.string(),
  rotationNote: z.string().nullish(),
  requiresAcknowledgement: z.boolean().nullish(),
});

export const OrganicAdvisorySchema = z.object({
  agents: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['fungal', 'bacterial', 'botanical', 'other']),
      dose: DoseSchema,
      method: z.string(),
      timing: z.string(),
      frequency: z.string(),
    }),
  ),
  effectiveness: z.object({
    relativePct: z.number().min(0).max(100),
    onsetDays: z.number().nonnegative(),
    note: z.string(),
  }),
  recipes: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        yields: z.string(),
        prepTime: z.string(),
        ingredients: z.array(z.object({ name: z.string(), quantity: z.string() })),
        steps: z.array(z.string()),
        shelfLife: z.string(),
        caution: z.string().nullish(),
      }),
    )
    .nullish(),
  traps: z
    .array(z.object({ name: z.string(), detail: z.string(), perArea: QuantitySchema.nullish() }))
    .nullish(),
  companionCrops: z.array(z.object({ name: z.string(), benefit: z.string() })).nullish(),
  amendments: z
    .array(
      z.object({
        id: z.string(),
        nutrient: NutrientKeySchema,
        nutrientStatus: NutrientStatusSchema,
        product: z.string(),
        dose: DoseSchema,
        timing: z.string(),
        note: z.string(),
      }),
    )
    .nullish(),
  culturalPractices: z.array(z.string()).nullish(),
});

const CostBreakdownSchema = z.object({
  total: z.number(),
  perArea: z.number(),
  lines: z.array(z.object({ label: z.string(), amount: z.number() })),
});

export const DualAdvisorySchema = z.object({
  id: z.string(),
  analysisId: z.string(),
  cropName: z.string(),
  diseaseName: z.string().nullish(),
  isHealthy: z.boolean(),
  lowConfidence: z.boolean().nullish(),
  area: z.number().positive(),
  areaUnit: AreaUnitSchema,
  chemical: ChemicalAdvisorySchema.nullish(),
  chemicalUnavailableReason: z.enum(['healthy', 'no_diagnosis']).nullish(),
  organic: OrganicAdvisorySchema,
  cost: z.object({
    currency: z.string(),
    chemical: CostBreakdownSchema.nullish(),
    organic: CostBreakdownSchema,
    note: z.string().nullish(),
  }),
  rationale: z
    .array(z.object({ source: z.enum(['soil', 'diagnosis', 'crop', 'stage']), title: z.string(), detail: z.string() }))
    .nullish(),
  disclaimer: z.string(),
  saved: z.boolean().nullish(),
  generatedAt: z.string(),
  contentLang: LangSchema.nullish(),
});

export const AdvisoryReportSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('url'), url: z.string(), fileName: z.string() }),
  z.object({ kind: z.literal('unavailable') }),
]);

export const ShareMessageSchema = z.object({ text: z.string().min(1) });
export const SavedSchema = z.object({ saved: z.boolean() });

export type ChemicalAdvisoryDto = z.infer<typeof ChemicalAdvisorySchema>;
export type OrganicAdvisoryDto = z.infer<typeof OrganicAdvisorySchema>;
export type DualAdvisoryDto = z.infer<typeof DualAdvisorySchema>;
export type AdvisoryReportDto = z.infer<typeof AdvisoryReportSchema>;
