import { cx } from '@/utils/browser';

const TONES = {
  default: 'text-ink',
  forest: 'text-forest',
  clay: 'text-clay',
  chem: 'text-chem',
  organic: 'text-organic',
  danger: 'text-danger',
};

export default function Stat({ label, value, unit, hint, icon: Icon, tone = 'default', className }) {
  return (
    <div className={cx('min-w-0', className)}>
      <div className="flex items-center gap-1.5 text-sm font-medium text-ink-muted">
        {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
        <span className="truncate">{label}</span>
      </div>
      <div className={cx('mt-1 flex items-baseline gap-1 font-display text-2xl font-semibold tabular sm:text-3xl', TONES[tone])}>
        <span>{value}</span>
        {unit ? <span className="font-sans text-sm font-medium text-ink-muted">{unit}</span> : null}
      </div>
      {hint ? <p className="mt-0.5 text-sm text-ink-muted">{hint}</p> : null}
    </div>
  );
}
