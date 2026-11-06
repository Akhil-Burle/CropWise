import { cx } from '@/utils/browser';

export default function EmptyState({ icon: Icon, title, description, action, className, compact = false }) {
  return (
    <div
      className={cx(
        'flex flex-col items-center rounded-lg border border-dashed border-line text-center',
        compact ? 'gap-2 px-4 py-6' : 'gap-3 px-6 py-10',
        className,
      )}
    >
      {Icon ? (
        <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-2 text-ink-muted" aria-hidden="true">
          <Icon className="h-7 w-7" />
        </span>
      ) : null}
      <div className="max-w-sm">
        <p className="font-display text-lg font-semibold">{title}</p>
        {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
