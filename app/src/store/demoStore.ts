import { create } from 'zustand';

/** Steps of the "Run full demo" walkthrough, in order. Pages advance it when they finish their part. */
export const DEMO_STEPS = [
  'wizard_details',
  'wizard_soil',
  'wizard_leaf',
  'wizard_review',
  'processing',
  'ocr_review',
  'diagnosis',
  'advisory',
  'transition',
  'done',
] as const;

export type DemoStep = (typeof DEMO_STEPS)[number];

interface DemoState {
  running: boolean;
  step: DemoStep;
  paused: boolean;
  start: () => void;
  stop: () => void;
  advance: (from: DemoStep) => void;
  togglePause: () => void;
}

export const useDemo = create<DemoState>()((set, get) => ({
  running: false,
  step: 'wizard_details',
  paused: false,
  start: () => set({ running: true, step: 'wizard_details', paused: false }),
  stop: () => set({ running: false, paused: false }),
  togglePause: () => set({ paused: !get().paused }),
  advance: (from) => {
    const { step, running } = get();
    if (!running || step !== from) return;
    const i = DEMO_STEPS.indexOf(step);
    set({ step: DEMO_STEPS[Math.min(DEMO_STEPS.length - 1, i + 1)] });
  },
}));
