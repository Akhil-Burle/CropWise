import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cx } from '@/utils/browser';

const VARIANTS = {
  primary: 'bg-forest text-on-forest hover:bg-forest/90 shadow-sm',
  secondary: 'bg-surface text-ink border border-line hover:bg-surface-2',
  ghost: 'text-ink hover:bg-surface-2',
  danger: 'bg-danger text-white hover:bg-danger/90 dark:text-forest-deep',
  chem: 'bg-chem text-white hover:bg-chem/90 dark:text-forest-deep',
  organic: 'bg-organic text-white hover:bg-organic/90 dark:text-forest-deep',
  clay: 'bg-clay text-white hover:bg-clay/90 dark:text-forest-deep',
  link: 'text-forest underline-offset-4 hover:underline px-0',
};

const SIZES = {
  sm: 'min-h-[40px] px-3 text-sm gap-1.5 rounded-md',
  md: 'min-h-touch px-4 text-[0.95rem] gap-2 rounded-md',
  lg: 'min-h-[56px] px-6 text-base gap-2.5 rounded-lg',
};

/**
 * Primary action primitive. Renders <button>, <Link> (to) or <a> (href).
 * Icons are always paired with visible text unless `iconOnly` is set with a `label`.
 */
const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconRight: IconRight,
    loading = false,
    fullWidth = false,
    iconOnly = false,
    label,
    to,
    href,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  const classes = cx(
    'inline-flex select-none items-center justify-center font-semibold transition-colors duration-150',
    'disabled:cursor-not-allowed disabled:opacity-55',
    VARIANTS[variant],
    iconOnly ? 'min-h-touch min-w-touch rounded-md p-0' : SIZES[size],
    fullWidth && 'w-full',
    className,
  );
  const content = (
    <>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : Icon ? <Icon className="h-5 w-5 shrink-0" aria-hidden="true" /> : null}
      {iconOnly ? <span className="sr-only">{label}</span> : children}
      {IconRight && !iconOnly ? <IconRight className="h-5 w-5 shrink-0" aria-hidden="true" /> : null}
    </>
  );
  const a11y = iconOnly ? { 'aria-label': label, title: label } : {};

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...a11y} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...a11y} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...a11y}
      {...rest}
    >
      {content}
    </button>
  );
});

export default Button;
