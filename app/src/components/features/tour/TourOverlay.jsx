import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { useAuthStore } from '@/store/authStore';
import { useDemo } from '@/store/demoStore';
import { usePrefs } from '@/store/prefsStore';
import { Button } from '@/components/ui';

const ALL_STEPS = [
  { id: 'welcome', target: null },
  { id: 'analysis', target: 'nav-analysis' },
  { id: 'demo', target: 'run-demo', demoOnly: true },
  { id: 'lang', target: 'lang' },
  { id: 'phi', target: 'phi-alerts' },
  { id: 'quick', target: 'quick-actions' },
  { id: 'transition', target: 'nav-transition' },
];

function findVisible(target) {
  if (!target) return null;
  const nodes = [...document.querySelectorAll(`[data-tour="${target}"]`)];
  return nodes.find((n) => n.getClientRects().length > 0 && getComputedStyle(n).visibility !== 'hidden') ?? null;
}

/** First-run spotlight tour of the dashboard. Steps whose target is not on screen are skipped. */
export default function TourOverlay() {
  const { t } = useTranslation();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const tourDone = usePrefs((s) => s.tourDone);
  const setTourDone = usePrefs((s) => s.setTourDone);
  const demoRunning = useDemo((s) => s.running);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [ready, setReady] = useState(false);
  const cardRef = useRef(null);

  const active = Boolean(user) && !tourDone && !demoRunning && location.pathname === '/app';

  const steps = useMemo(() => {
    if (!active || !ready) return [];
    return ALL_STEPS.filter((s) => (!s.demoOnly || config.flags.demoMode) && (s.target === null || findVisible(s.target)));
  }, [active, ready]);

  // Give the dashboard a moment to render its cards before resolving targets.
  useEffect(() => {
    if (!active) {
      setReady(false);
      return undefined;
    }
    const id = setTimeout(() => setReady(true), 900);
    return () => clearTimeout(id);
  }, [active]);

  const step = steps[index];

  const measure = useCallback(() => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    const el = findVisible(step.target);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  useLayoutEffect(() => {
    if (!step) return undefined;
    const el = findVisible(step.target);
    el?.scrollIntoView({ block: 'center', behavior: 'auto' });
    measure();
    cardRef.current?.focus();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step, measure]);

  const finish = useCallback(() => {
    setTourDone(true);
    setIndex(0);
  }, [setTourDone]);

  useEffect(() => {
    if (!step) return undefined;
    const onKey = (e) => e.key === 'Escape' && finish();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [step, finish]);

  if (!step) return null;

  const pad = 6;
  const below = rect ? rect.top + rect.height + 220 < window.innerHeight : true;
  const cardStyle = rect
    ? {
        top: below ? rect.top + rect.height + 14 : undefined,
        bottom: below ? undefined : window.innerHeight - rect.top + 14,
        left: Math.max(12, Math.min(rect.left, window.innerWidth - 352)),
      }
    : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <div className="no-print fixed inset-0 z-[75]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-lg ring-4 ring-ochre transition-all duration-200"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: '0 0 0 9999px rgba(9, 21, 14, 0.62)',
          }}
          aria-hidden="true"
        />
      ) : (
        <div className="absolute inset-0 bg-forest-deep/60" aria-hidden="true" />
      )}
      <div
        ref={cardRef}
        tabIndex={-1}
        className="absolute w-[min(340px,calc(100vw-24px))] rounded-xl border border-line bg-surface p-5 shadow-pop outline-none"
        style={cardStyle}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-clay">{t('tour.progress', { step: index + 1, total: steps.length })}</p>
        <h2 id="tour-title" className="mt-1 text-xl font-semibold">
          {t(`tour.${step.id}.title`)}
        </h2>
        <p className="mt-2 text-ink-muted">{t(`tour.${step.id}.body`)}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={finish}>
            {t('tour.skip')}
          </Button>
          <div className="flex gap-2">
            {index > 0 ? (
              <Button variant="secondary" size="sm" onClick={() => setIndex((i) => i - 1)}>
                {t('common.back')}
              </Button>
            ) : null}
            <Button size="sm" onClick={() => (index + 1 < steps.length ? setIndex((i) => i + 1) : finish())}>
              {index + 1 < steps.length ? t('common.next') : t('tour.finish')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
