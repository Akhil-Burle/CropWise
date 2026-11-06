import type { ISODate, Localized, PageParams, Lang } from './common';
import type { ToxicityClass } from './advisory';

/* ---------- Learn hub ---------- */

export type ArticleCategory = 'guide' | 'safety' | 'ipm' | 'organic' | 'soil';
export const ARTICLE_CATEGORIES: readonly ArticleCategory[] = ['guide', 'safety', 'ipm', 'organic', 'soil'] as const;

export type ArticleTone = 'forest' | 'clay' | 'ochre' | 'chem' | 'organic';

export type ArticleBlock =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'steps'; items: string[] }
  | { type: 'list'; items: string[] }
  | { type: 'tip'; text: string }
  | { type: 'warning'; text: string }
  | { type: 'ingredients'; items: { name: string; quantity: string }[] }
  | { type: 'toxicity'; items: { class: ToxicityClass; label: string; meaning: string }[] };

export interface ArticleSummary extends Localized {
  id: string;
  title: string;
  summary: string;
  category: ArticleCategory;
  readMinutes: number;
  level: 'beginner' | 'intermediate';
  tone: ArticleTone;
  bookmarked: boolean;
}

export interface Article extends ArticleSummary {
  blocks: ArticleBlock[];
  updatedAt: ISODate;
  source: string | null;
}

export interface ArticleListParams extends PageParams {
  lang: Lang;
  category?: ArticleCategory;
  bookmarkedOnly?: boolean;
}

export interface GlossaryTerm extends Localized {
  id: string;
  term: string;
  definition: string;
}

export interface MythFact extends Localized {
  id: string;
  myth: string;
  fact: string;
}

export interface QuizQuestion extends Localized {
  id: string;
  question: string;
  options: { id: string; text: string }[];
}

export interface QuizAnswerResult {
  correct: boolean;
  correctOptionId: string;
  explanation: string;
}

/* ---------- Helpline & chat ---------- */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: ISODate;
  suggestions: string[];
}

export interface Helpline extends Localized {
  id: string;
  name: string;
  number: string;
  hours: string;
  description: string;
  isDemo: boolean;
}

/* ---------- Weather ---------- */

export type WeatherCondition = 'sunny' | 'partly_cloudy' | 'cloudy' | 'rain' | 'storm';

export interface WeatherReport extends Localized {
  farmId: string;
  location: string;
  tempC: number;
  humidityPct: number;
  rainChancePct: number;
  windKph: number;
  condition: WeatherCondition;
  sprayWindow: { ok: boolean; message: string };
  forecast: { date: ISODate; condition: WeatherCondition; maxC: number; minC: number; rainChancePct: number }[];
  isDemo: boolean;
}

/* ---------- Demo samples ---------- */

export interface SampleAsset {
  id: string;
  kind: 'soil_card' | 'leaf';
  title: string;
  description: string;
  imageUrl: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  tag: 'main' | 'edge';
  farmId: string;
  cropId: string;
  growthStage: 'vegetative' | 'flowering' | 'fruiting';
  area: number;
  soilSampleId: string;
  leafSampleId: string;
}
