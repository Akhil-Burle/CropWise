import type { AreaUnit, ISODate, Lang, Localized, Quantity } from './common';
import type { NutrientKey, NutrientStatus } from './soil';

/** CIB&RC-style label colour classes. */
export type ToxicityClass = 'red' | 'yellow' | 'blue' | 'green';

/** A dose expressed per unit area and as a total for the entered area. */
export interface Dose {
  perArea: Quantity;
  total: Quantity;
}

export type PpeIcon = 'gloves' | 'mask' | 'goggles' | 'coverall' | 'boots' | 'cap';

export interface PpeItem {
  id: string;
  label: string;
  icon: PpeIcon;
  required: boolean;
}

export interface TankMix {
  tankSizeL: number;
  tankCount: number;
  dosePerTank: Quantity;
}

export interface ChemicalAdvisory {
  productName: string | null;
  activeIngredient: string;
  formulation: string;
  dose: Dose;
  water: Dose;
  tank: TankMix | null;
  toxicity: { class: ToxicityClass; label: string; description: string };
  phiDays: number;
  reentryHours: number | null;
  sprayTiming: string;
  maxApplications: number | null;
  intervalDays: number | null;
  ppe: PpeItem[];
  storage: string[];
  disposal: string[];
  firstAid: string[];
  warnings: string[];
  complianceNote: string;
  rotationNote: string | null;
  requiresAcknowledgement: boolean;
}

export interface BioAgent {
  id: string;
  name: string;
  type: 'fungal' | 'bacterial' | 'botanical' | 'other';
  dose: Dose;
  method: string;
  timing: string;
  frequency: string;
}

export interface Recipe {
  id: string;
  title: string;
  yields: string;
  prepTime: string;
  ingredients: { name: string; quantity: string }[];
  steps: string[];
  shelfLife: string;
  caution: string | null;
}

export interface SoilAmendment {
  id: string;
  nutrient: NutrientKey;
  nutrientStatus: NutrientStatus;
  product: string;
  dose: Dose;
  timing: string;
  note: string;
}

export interface OrganicAdvisory {
  agents: BioAgent[];
  effectiveness: { relativePct: number; onsetDays: number; note: string };
  recipes: Recipe[];
  traps: { name: string; detail: string; perArea: Quantity | null }[];
  companionCrops: { name: string; benefit: string }[];
  amendments: SoilAmendment[];
  culturalPractices: string[];
}

export interface CostBreakdown {
  total: number;
  perArea: number;
  lines: { label: string; amount: number }[];
}

export interface CostComparison {
  currency: string;
  chemical: CostBreakdown | null;
  organic: CostBreakdown;
  note: string;
}

export interface RationaleItem {
  source: 'soil' | 'diagnosis' | 'crop' | 'stage';
  title: string;
  detail: string;
}

export type ChemicalUnavailableReason = 'healthy' | 'no_diagnosis';

export interface DualAdvisory extends Localized {
  id: string;
  analysisId: string;
  cropName: string;
  diseaseName: string | null;
  isHealthy: boolean;
  lowConfidence: boolean;
  area: number;
  areaUnit: AreaUnit;
  chemical: ChemicalAdvisory | null;
  chemicalUnavailableReason: ChemicalUnavailableReason | null;
  organic: OrganicAdvisory;
  cost: CostComparison;
  rationale: RationaleItem[];
  disclaimer: string;
  saved: boolean;
  generatedAt: ISODate;
}

export interface AdvisoryParams {
  analysisId: string;
  area: number;
  areaUnit: AreaUnit;
  lang: Lang;
}

export type AdvisoryReport =
  | { kind: 'url'; url: string; fileName: string }
  | { kind: 'unavailable' };

export interface ShareMessage {
  text: string;
}
