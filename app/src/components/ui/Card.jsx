import { cx } from '@/utils/browser';

const TONES = {
  default: 'bg-surface border border-line shadow-card dark:shadow-none',
  inset: 'bg-surface-2 border border-transparent',
  chem: 'bg-surface border-2 border-chem/40 shadow-card dark:shadow-none',
  organic: 'bg-surface border-2 border-organic/40 shadow-card dark:shadow-none',
  warn: 'bg-warn/10 border border-warn/40',
  danger: 'bg-danger/10 border-2 border-danger/50',
  forest: 'bg-forest-deep text-on-forest border border-forest-deep dark:bg-surface-2 dark:text-ink dark:border-line',
};

export function Card({ as: Tag = 'section', tone = 'default', padded = true, className, children, ...rest }) {
  return (
    <Tag className={cx('rounded-lg', TONES[tone], padded && 'p-5 sm:p-6', className)} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, icon: Icon, action, level = 2, className, iconClassName }) {
  const H = `h${level}`;
  return (
    <div className={cx('mb-4 flex items-start gap-3', className)}>
      {Icon ? (
        <span className={cx('mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-md bg-surface-2 text-forest', iconClassName)} aria-hidden="true">
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <H className="text-lg font-semibold leading-snug">{title}</H>
        {subtitle ? <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export default Card;
