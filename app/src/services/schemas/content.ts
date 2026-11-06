import { z } from 'zod';
import { LangSchema } from './common';
import { ToxicityClassSchema } from './advisory';

/* ---------- Learn ---------- */

const CategorySchema = z.enum(['guide', 'safety', 'ipm', 'organic', 'soil']);

export const ArticleSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  category: CategorySchema,
  readMinutes: z.number().int().positive().nullish(),
  level: z.enum(['beginner', 'intermediate']).nullish(),
  tone: z.enum(['forest', 'clay', 'ochre', 'chem', 'organic']).nullish(),
  bookmarked: z.boolean().nullish(),
  contentLang: LangSchema.nullish(),
});

export const ArticleBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('p'), text: z.string() }),
  z.object({ type: z.literal('h'), text: z.string() }),
  z.object({ type: z.literal('steps'), items: z.array(z.string()) }),
  z.object({ type: z.literal('list'), items: z.array(z.string()) }),
  z.object({ type: z.literal('tip'), text: z.string() }),
  z.object({ type: z.literal('warning'), text: z.string() }),
  z.object({ type: z.literal('ingredients'), items: z.array(z.object({ name: z.string(), quantity: z.string() })) }),
  z.object({
    type: z.literal('toxicity'),
    items: z.array(z.object({ class: ToxicityClassSchema, label: z.string(), meaning: z.string() })),
  }),
]);

export const ArticleSchema = ArticleSummarySchema.extend({
  blocks: z.array(ArticleBlockSchema),
  updatedAt: z.string(),
  source: z.string().nullish(),
});

export const GlossaryTermSchema = z.object({
  id: z.string(),
  term: z.string(),
  definition: z.string(),
  contentLang: LangSchema.nullish(),
});

export const MythFactSchema = z.object({
  id: z.string(),
  myth: z.string(),
  fact: z.string(),
  contentLang: LangSchema.nullish(),
});

export const QuizQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.object({ id: z.string(), text: z.string() })).min(2),
  contentLang: LangSchema.nullish(),
});

export const QuizAnswerSchema = z.object({
  correct: z.boolean(),
  correctOptionId: z.string(),
  explanation: z.string(),
});

export const BookmarkSchema = z.object({ bookmarked: z.boolean() });

/* ---------- Chat & helpline ---------- */

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  text: z.string(),
  createdAt: z.string(),
  suggestions: z.array(z.string()).nullish(),
});

export const HelplineSchema = z.object({
  id: z.string(),
  name: z.string(),
  number: z.string(),
  hours: z.string(),
  description: z.string(),
  isDemo: z.boolean().nullish(),
  contentLang: LangSchema.nullish(),
});

/* ---------- Weather ---------- */

const ConditionSchema = z.enum(['sunny', 'partly_cloudy', 'cloudy', 'rain', 'storm']);

export const WeatherSchema = z.object({
  farmId: z.string(),
  location: z.string(),
  tempC: z.number(),
  humidityPct: z.number(),
  rainChancePct: z.number(),
  windKph: z.number(),
  condition: ConditionSchema,
  sprayWindow: z.object({ ok: z.boolean(), message: z.string() }),
  forecast: z.array(
    z.object({
      date: z.string(),
      condition: ConditionSchema,
      maxC: z.number(),
      minC: z.number(),
      rainChancePct: z.number(),
    }),
  ),
  isDemo: z.boolean().nullish(),
  contentLang: LangSchema.nullish(),
});

/* ---------- Demo samples ---------- */

export const SampleAssetSchema = z.object({
  id: z.string(),
  kind: z.enum(['soil_card', 'leaf']),
  title: z.string(),
  description: z.string(),
  imageUrl: z.string(),
});

export const DemoScenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  tag: z.enum(['main', 'edge']),
  farmId: z.string(),
  cropId: z.string(),
  growthStage: z.enum(['vegetative', 'flowering', 'fruiting']),
  area: z.number().positive(),
  soilSampleId: z.string(),
  leafSampleId: z.string(),
});

/* ---------- Admin ---------- */

const AdoptionSchema = z.enum(['chemical', 'organic', 'mixed', 'none']);

export const FarmerSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  village: z.string(),
  district: z.string(),
  state: z.string(),
  farmCount: z.number().int(),
  totalArea: z.number(),
  lastAnalysisAt: z.string().nullish(),
  adoption: AdoptionSchema,
});

export const AdminAnalyticsSchema = z.object({
  totals: z.object({
    farmers: z.number(),
    analyses: z.number(),
    advisoriesSaved: z.number(),
    organicAdoptionPct: z.number(),
  }),
  byDisease: z.array(z.object({ name: z.string(), count: z.number() })),
  byDistrict: z.array(z.object({ district: z.string(), count: z.number() })),
  adoption: z.array(z.object({ key: AdoptionSchema, value: z.number() })),
  monthly: z.array(z.object({ month: z.string(), analyses: z.number(), organicActions: z.number() })),
  isDemo: z.boolean().nullish(),
});

export const RuleEntrySchema = z.object({
  id: z.string(),
  type: z.enum(['chemical', 'organic']),
  cropName: z.string(),
  diseaseName: z.string(),
  title: z.string(),
  summary: z.string(),
  details: z.array(z.object({ label: z.string(), value: z.string() })),
  source: z.string(),
  updatedAt: z.string(),
});

export type ArticleSummaryDto = z.infer<typeof ArticleSummarySchema>;
export type ArticleDto = z.infer<typeof ArticleSchema>;
export type ChatMessageDto = z.infer<typeof ChatMessageSchema>;
export type HelplineDto = z.infer<typeof HelplineSchema>;
export type WeatherDto = z.infer<typeof WeatherSchema>;
export type FarmerSummaryDto = z.infer<typeof FarmerSummarySchema>;
export type AdminAnalyticsDto = z.infer<typeof AdminAnalyticsSchema>;
export type RuleEntryDto = z.infer<typeof RuleEntrySchema>;

export const ExpertNoteSchema = z.object({
  id: z.string(),
  farmerId: z.string(),
  analysisId: z.string().nullish(),
  fromName: z.string(),
  text: z.string(),
  createdAt: z.string(),
  read: z.boolean().nullish(),
});

export const ReviewItemSchema = z.object({
  analysisId: z.string(),
  farmerId: z.string(),
  farmerName: z.string(),
  village: z.string(),
  cropName: z.string(),
  diseaseName: z.string().nullish(),
  confidence: z.number().nullish(),
  reason: z.enum(['low_confidence', 'soil_unconfirmed', 'partial']),
  createdAt: z.string(),
});

export type ExpertNoteDto = z.infer<typeof ExpertNoteSchema>;
export type ReviewItemDto = z.infer<typeof ReviewItemSchema>;
