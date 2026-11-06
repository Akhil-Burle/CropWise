import { cloneElement, forwardRef, isValidElement, useId } from 'react';
import { Check, Minus, Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cx } from '@/utils/browser';

const INPUT =
  'block w-full min-h-touch rounded-md border bg-surface px-3.5 text-base text-ink placeholder:text-ink-muted/70 transition-colors ' +
  'focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/30 disabled:opacity-60';

/** Label + hint + error wrapper. Wires id / aria-describedby / aria-invalid onto its single child. */
export function Field({ label, hint, error, required, children, className, labelHidden = false }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = [hint && hintId, error && errId].filter(Boolean).join(' ') || undefined;
  const child = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'aria-required': required || undefined,
      })
    : children;
  return (
    <div className={cx('space-y-1.5', className)}>
      <label htmlFor={isValidElement(children) ? children.props.id ?? id : undefined} className={cx('block text-sm font-semibold', labelHidden && 'sr-only')}>
        {label}
        {required ? <span className="text-danger" aria-hidden="true"> *</span> : null}
      </label>
      {child}
      {hint && !error ? (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errId} className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const TextInput = forwardRef(function TextInput({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cx(INPUT, props['aria-invalid'] || invalid ? 'border-danger' : 'border-line', className)}
      {...props}
    />
  );
});

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cx(INPUT, 'min-h-[96px] py-3', props['aria-invalid'] ? 'border-danger' : 'border-line', className)} {...props} />;
});

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cx(
        INPUT,
        'appearance-none bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10',
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2356605A' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
        props['aria-invalid'] ? 'border-danger' : 'border-line',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

/** Numeric input with large −/+ buttons for gloved or low-dexterity use. */
export const NumberInput = forwardRef(function NumberInput(
  { value, onChange, step = 1, min, max, unit, className, decimals = 2, ...props },
  ref,
) {
  const { t } = useTranslation();
  const clamp = (n) => {
    let v = Math.round(n * 10 ** decimals) / 10 ** decimals;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };
  const num = typeof value === 'number' && Number.isFinite(value) ? value : null;
  return (
    <div className={cx('flex items-stretch gap-2', className)}>
      <button
        type="button"
        className="grid min-h-touch min-w-touch place-items-center rounded-md border border-line bg-surface text-ink hover:bg-surface-2 disabled:opacity-50"
        onClick={() => onChange(clamp((num ?? 0) - step))}
        disabled={props.disabled || (min !== undefined && num !== null && num <= min)}
        aria-label={t('common.decrease')}
      >
        <Minus className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="relative min-w-0 flex-1">
        <input
          ref={ref}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          value={num ?? ''}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === '' ? null : Number(raw));
          }}
          className={cx(INPUT, 'text-center font-semibold tabular', unit && 'pr-14', props['aria-invalid'] ? 'border-danger' : 'border-line')}
          {...props}
        />
        {unit ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-muted">{unit}</span>
        ) : null}
      </div>
      <button
        type="button"
        className="grid min-h-touch min-w-touch place-items-center rounded-md border border-line bg-surface text-ink hover:bg-surface-2 disabled:opacity-50"
        onClick={() => onChange(clamp((num ?? 0) + step))}
        disabled={props.disabled || (max !== undefined && num !== null && num >= max)}
        aria-label={t('common.increase')}
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
});

export function Checkbox({ checked, onChange, label, description, disabled, className, tone = 'forest' }) {
  const id = useId();
  const toneCls = tone === 'chem' ? 'peer-checked:bg-chem peer-checked:border-chem' : tone === 'organic' ? 'peer-checked:bg-organic peer-checked:border-organic' : 'peer-checked:bg-forest peer-checked:border-forest';
  return (
    <label htmlFor={id} className={cx('flex min-h-touch cursor-pointer items-start gap-3 rounded-md py-2', disabled && 'cursor-not-allowed opacity-60', className)}>
      <span className="relative mt-0.5 grid shrink-0 place-items-center">
        <input
          id={id}
          type="checkbox"
          className="peer h-6 w-6 cursor-pointer appearance-none rounded-md border-2 border-ink-muted bg-surface"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className={cx('pointer-events-none absolute inset-0 rounded-md border-2 border-transparent', toneCls)} aria-hidden="true" />
        <Check className="pointer-events-none absolute h-4 w-4 text-white opacity-0 peer-checked:opacity-100 dark:text-forest-deep" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block font-medium leading-snug">{label}</span>
        {description ? <span className="block text-sm text-ink-muted">{description}</span> : null}
      </span>
    </label>
  );
}

export function Switch({ checked, onChange, label, description, disabled }) {
  const id = useId();
  return (
    <div className="flex min-h-touch items-center justify-between gap-4 py-2">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block font-medium">{label}</span>
        {description ? <span className="block text-sm text-ink-muted">{description}</span> : null}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition-colors disabled:opacity-50',
          checked ? 'border-forest bg-forest' : 'border-line bg-surface-2',
        )}
      >
        <span
          className={cx(
            'inline-block h-6 w-6 rounded-full bg-surface shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-0.5',
          )}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, label, className }) {
  return (
    <div className={cx('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className={cx(INPUT, 'border-line pl-10')}
      />
    </div>
  );
}
