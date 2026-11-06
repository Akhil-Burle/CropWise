import type { Localized } from './common';

export type TransitionSpeed = 'conservative' | 'balanced' | 'aggressive';
export const TRANSITION_SPEEDS: readonly TransitionSpeed[] = ['conservative', 'balanced', 'aggressive'] as const;

export interface TransitionYear {
  year: number;
  title: string;
  chemicalPct: number;
  organicPct: number;
  focus: string[];
}

/** Cumulative net profit for the farm (currency units) if staying conventional vs transitioning. */
export interface RoiPoint {
  label: string;
  chemical: number;
  organic: number;
  /** organic − chemical; ≥ 0 means the transition has paid back. */
  difference: number;
}

export interface YieldPoint {
  label: string;
  chemical: number;
  transition: number;
}

export interface SocPoint {
  label: string;
  value: number;
}

export interface SeasonTask {
  id: string;
  label: string;
  category: 'soil' | 'bio' | 'chemical' | 'monitoring' | 'market';
  done: boolean;
}

export interface TransitionSeason {
  id: string;
  label: string;
  current: boolean;
  tasks: SeasonTask[];
}

export interface TransitionPlan extends Localized {
  id: string;
  farmId: string;
  speed: TransitionSpeed;
  currency: string;
  years: TransitionYear[];
  roi: RoiPoint[];
  breakEven: { index: number; label: string } | null;
  yieldCurve: YieldPoint[];
  maxYieldDipPct: number;
  soc: SocPoint[];
  socStart: number;
  socTarget: number;
  socTargetReachedLabel: string | null;
  seasons: TransitionSeason[];
  thisSeason: { title: string; chemicalPct: number; organicPct: number; changes: string[] };
  assumptions: string[];
}
