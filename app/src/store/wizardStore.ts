import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { GrowthStage, UploadRef } from '@/types';

export interface WizardDraft {
  step: number;
  farmId: string | null;
  cropId: string | null;
  growthStage: GrowthStage | null;
  area: number | null;
  soil: UploadRef | null;
  leaf: UploadRef | null;
}

interface WizardState extends WizardDraft {
  patch: (p: Partial<WizardDraft>) => void;
  reset: () => void;
}

const EMPTY: WizardDraft = {
  step: 0,
  farmId: null,
  cropId: null,
  growthStage: null,
  area: null,
  soil: null,
  leaf: null,
};

/** Draft of the New Analysis wizard; survives a reload within the tab. */
export const useWizard = create<WizardState>()(
  persist(
    (set) => ({
      ...EMPTY,
      patch: (p) => set(p),
      reset: () => set(EMPTY),
    }),
    { name: 'cropwise-wizard', storage: createJSONStorage(() => sessionStorage) },
  ),
);
