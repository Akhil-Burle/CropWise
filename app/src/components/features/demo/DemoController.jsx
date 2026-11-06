import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from '@/components/ui/motion';
import { CheckCircle2, Pause, Play, PlayCircle, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { DEMO_STEPS, useDemo } from '@/store/demoStore';
import { useWizard } from '@/store/wizardStore';
import { Button } from '@/components/ui';

/**
 * Floating control for "Run full demo". Each page performs its own step via useDemoStep;
 * this component starts the walkthrough, shows progress and lets the presenter pause or stop.
 */
export default function DemoController() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { running, step, paused, stop, togglePause } = useDemo();
  const resetWizard = useWizard((s) => s.reset);
  const wasRunning = useRef(false);

  useEffect(() => {
    if (running && !wasRunning.current) {
      resetWizard();
      navigate('/app/analysis/new');
    }
    wasRunning.current = running;
  }, [running, navigate, resetWizard]);

  if (!config.flags.demoMode) return null;
  const index = DEMO_STEPS.indexOf(step);
  const total = DEMO_STEPS.length - 1;
  const done = step === 'done';

  return (
    <AnimatePresence>
      {running ? (
        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="no-print fixed inset-x-3 bottom-[76px] z-40 mx-auto max-w-xl rounded-xl border border-clay/40 bg-surface p-4 shadow-pop lg:bottom-6 lg:left-auto lg:right-6 lg:mx-0 lg:w-[26rem]"
          aria-live="polite"
          aria-label={t('demo.panelLabel')}
        >
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-clay/10 text-clay" aria-hidden="true">
              {done ? <CheckCircle2 className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-clay">
                {done ? t('demo.complete') : t('demo.stepOf', { step: index + 1, total })}
              </p>
              <p className="font-semibold">{t(`demo.steps.${step}`)}</p>
              {!done ? (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                  <div className="h-full rounded-full bg-clay transition-all duration-500" style={{ width: `${((index + 1) / total) * 100}%` }} />
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            {done ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => { stop(); navigate('/app'); }}>
                  {t('demo.toDashboard')}
                </Button>
                <Button variant="clay" size="sm" onClick={stop}>
                  {t('common.close')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" size="sm" icon={paused ? Play : Pause} onClick={togglePause}>
                  {paused ? t('demo.resume') : t('demo.pause')}
                </Button>
                <Button variant="danger" size="sm" icon={Square} onClick={stop}>
                  {t('demo.stop')}
                </Button>
              </>
            )}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
