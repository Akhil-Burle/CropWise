import { useEffect, useRef } from 'react';
import { useDemo, type DemoStep } from '@/store/demoStore';

/**
 * While "Run full demo" is on and the walkthrough is at `step`, runs `action` after `delayMs`
 * (pausing respected). Pages use this to perform the same action a user would click.
 */
export function useDemoStep(step: DemoStep, action: () => void | Promise<void>, delayMs: number, ready = true): boolean {
  const running = useDemo((s) => s.running);
  const current = useDemo((s) => s.step);
  const paused = useDemo((s) => s.paused);
  const actionRef = useRef(action);
  actionRef.current = action;
  const active = running && current === step;

  useEffect(() => {
    if (!active || paused || !ready) return undefined;
    const id = setTimeout(() => {
      void actionRef.current();
    }, delayMs);
    return () => clearTimeout(id);
  }, [active, paused, ready, delayMs]);

  return active;
}
