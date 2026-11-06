import { motion, useReducedMotion } from '@/components/ui/motion';
import { cx } from '@/utils/browser';

const BAR_TONE = {
  deficient: 'bg-status-deficient',
  sufficient: 'bg-status-sufficient',
  excess: 'bg-status-excess',
  neutral: 'bg-ink-muted',
};

/**
 * Horizontal range gauge. The healthy band (low–high) is shaded; the marker shows the value.
 * Purely presentational: `status` and the range come from the service.
 */
export default function Gauge({ value, low, high, max, status, label, valueText, className }) {
  const reduce = useReducedMotion();
  const scaleMax = max ?? Math.max(value ?? 0, (high ?? low ?? 1) * 1.6);
  const pct = (v) => `${Math.min(100, Math.max(0, (v / scaleMax) * 100))}%`;
  const bandStart = low !== null && low !== undefined ? pct(low) : '0%';
  const bandEnd = high !== null && high !== undefined ? pct(high) : '100%';

  return (
    <div className={cx('w-full', className)}>
      <div
        className="relative h-3 w-full overflow-hidden rounded-full bg-surface-2"
        role="meter"
        aria-label={label}
        aria-valuenow={value ?? undefined}
        aria-valuemin={0}
        aria-valuemax={scaleMax}
        aria-valuetext={valueText}
      >
        <div
          className="absolute inset-y-0 bg-status-sufficient/15 ring-1 ring-inset ring-status-sufficient/30"
          style={{ left: bandStart, width: `calc(${bandEnd} - ${bandStart})` }}
          aria-hidden="true"
        />
        {value !== null && value !== undefined ? (
          <motion.div
            className={cx('absolute inset-y-0 left-0 rounded-full', BAR_TONE[status ?? 'neutral'])}
            initial={reduce ? false : { width: 0 }}
            animate={{ width: pct(value) }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            aria-hidden="true"
          />
        ) : null}
      </div>
    </div>
  );
}

export function Meter({ value, tone = 'forest', label, className }) {
  const reduce = useReducedMotion();
  const TONE = {
    forest: 'bg-forest',
    warn: 'bg-warn',
    danger: 'bg-danger',
    chem: 'bg-chem',
    organic: 'bg-organic',
    ochre: 'bg-ochre',
  };
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      className={cx('h-2.5 w-full overflow-hidden rounded-full bg-surface-2', className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className={cx('h-full rounded-full', TONE[tone])}
        initial={reduce ? false : { width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  );
}
