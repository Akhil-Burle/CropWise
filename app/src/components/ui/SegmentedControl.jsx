import { useRef } from 'react';
import { cx } from '@/utils/browser';

/** Radio-group style single choice with large touch targets. */
export default function SegmentedControl({ options, value, onChange, label, className, size = 'md' }) {
  const refs = useRef([]);
  const onKeyDown = (e, i) => {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className={cx('inline-flex w-full gap-1 rounded-lg bg-surface-2 p-1', className)}>
      {options.map((opt, i) => {
        const checked = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cx(
              'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-2 text-sm font-semibold transition-colors',
              size === 'lg' ? 'min-h-[64px]' : 'min-h-touch',
              checked ? 'bg-surface text-forest shadow-sm ring-1 ring-forest/30' : 'text-ink-muted hover:text-ink',
            )}
          >
            <span className="flex items-center gap-1.5">
              {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
              {opt.label}
            </span>
            {opt.hint ? <span className="text-xs font-normal text-ink-muted">{opt.hint}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
