import { Check } from 'lucide-react';
import { cx } from '@/utils/browser';

/** Progress stepper. Completed steps can be revisited when `onStepClick` is given. */
export default function Stepper({ steps, current, onStepClick, label }) {
  return (
    <nav aria-label={label}>
      <ol className="flex items-start gap-1 sm:gap-2">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const clickable = Boolean(onStepClick) && done;
          const Tag = clickable ? 'button' : 'div';
          return (
            <li key={step.id} className="flex min-w-0 flex-1 flex-col items-stretch">
              <div className={cx('mb-2 h-1.5 rounded-full transition-colors', done || active ? 'bg-forest' : 'bg-line')} aria-hidden="true" />
              <Tag
                {...(clickable ? { type: 'button', onClick: () => onStepClick(i) } : {})}
                className={cx('flex min-h-touch items-center gap-2 rounded-md text-left', clickable && 'hover:bg-surface-2')}
                aria-current={active ? 'step' : undefined}
              >
                <span
                  className={cx(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-xs font-bold tabular',
                    done && 'border-forest bg-forest text-on-forest',
                    active && 'border-forest text-forest',
                    !done && !active && 'border-line text-ink-muted',
                  )}
                >
                  {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
                </span>
                <span className={cx('hidden truncate text-sm font-semibold sm:block', active ? 'text-ink' : 'text-ink-muted')}>
                  {step.label}
                </span>
                <span className="sr-only sm:hidden">{step.label}</span>
              </Tag>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
