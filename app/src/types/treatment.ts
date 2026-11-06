import type { ISODate, Lang, PageParams } from './common';

export type TreatmentType = 'chemical' | 'organic';
export type TreatmentStatus = 'scheduled' | 'done' | 'overdue' | 'skipped';

export interface Treatment {
  id: string;
  farmId: string;
  farmName: string | null;
  cropName: string | null;
  type: TreatmentType;
  title: string;
  product: string;
  dose: string | null;
  scheduledDate: ISODate;
  doneDate: ISODate | null;
  phiDays: number | null;
  /** Computed by the service from doneDate + PHI. */
  harvestSafeDate: ISODate | null;
  daysToSafe: number | null;
  status: TreatmentStatus;
  reminder: boolean;
  analysisId: string | null;
  notes: string | null;
}

export interface TreatmentListParams extends PageParams {
  lang: Lang;
  farmId?: string;
  status?: TreatmentStatus;
  /** Only items still to do (scheduled or overdue). */
  openOnly?: boolean;
  type?: TreatmentType;
  from?: ISODate;
  to?: ISODate;
}

export interface TreatmentInput {
  farmId: string;
  type: TreatmentType;
  title: string;
  product: string;
  dose: string | null;
  scheduledDate: ISODate;
  phiDays: number | null;
  reminder: boolean;
  analysisId: string | null;
}

export interface HarvestSafeResult {
  safeDate: ISODate;
  daysRemaining: number;
  isSafeToday: boolean;
}

export interface PhiAlert {
  treatmentId: string;
  farmName: string;
  cropName: string;
  product: string;
  safeDate: ISODate;
  daysRemaining: number;
}
