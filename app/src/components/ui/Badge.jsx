import { cx } from '@/utils/browser';

const TONES = {
  neutral: 'bg-surface-2 text-ink border-line',
  forest: 'bg-forest/10 text-forest border-forest/30',
  clay: 'bg-clay/10 text-clay border-clay/30',
  ochre: 'bg-ochre/15 text-ink border-ochre/40',
  chem: 'bg-chem-soft text-chem border-chem/30',
  organic: 'bg-organic-soft text-organic border-organic/30',
  info: 'bg-info/10 text-info border-info/30',
  warn: 'bg-warn/10 text-warn border-warn/40',
  danger: 'bg-danger/10 text-danger border-danger/40',
  success: 'bg-success/10 text-success border-success/30',
  deficient: 'bg-status-deficient/10 text-status-deficient border-status-deficient/40',
  sufficient: 'bg-status-sufficient/10 text-status-sufficient border-status-sufficient/40',
  excess: 'bg-status-excess/10 text-status-excess border-status-excess/40',
  solid: 'bg-forest text-on-forest border-forest',
};

export default function Badge({ tone = 'neutral', icon: Icon, size = 'md', className, children, ...rest }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-[0.8rem]',
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
