import { ChevronRight } from 'lucide-react';
import { cx } from '@/utils/browser';

/**
 * Table on wide screens, stacked cards on mobile. Columns: { key, header, render, className, primary, hideOnMobile }.
 * `primary` columns lead the mobile card.
 */
export default function DataTable({ columns, rows, rowKey, caption, onRowClick, rowLabel, empty, className }) {
  if (rows.length === 0 && empty) return empty;
  const primary = columns.filter((c) => c.primary);
  const secondary = columns.filter((c) => !c.primary && !c.hideOnMobile);

  return (
    <div className={className}>
      <div className="hidden overflow-x-auto rounded-lg border border-line md:block">
        <table className="w-full text-left text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className="bg-surface-2 text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cx('px-4 py-3 font-semibold', c.className)}>
                  {c.header}
                </th>
              ))}
              {onRowClick ? <th scope="col" className="w-10"><span className="sr-only">{rowLabel}</span></th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-surface">
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={cx(onRowClick && 'cursor-pointer hover:bg-surface-2/60 focus-within:bg-surface-2/60')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cx('px-4 py-3 align-middle', c.className)}>
                    {c.render(row)}
                  </td>
                ))}
                {onRowClick ? (
                  <td className="pr-3 text-right">
                    <button
                      type="button"
                      className="grid min-h-touch min-w-touch place-items-center rounded-md text-ink-muted hover:text-ink"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick(row);
                      }}
                      aria-label={`${rowLabel}: ${primary[0] ? textOf(primary[0].render(row)) : ''}`}
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden" aria-label={caption}>
        {rows.map((row) => {
          const body = (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">{primary.map((c) => <div key={c.key}>{c.render(row)}</div>)}</div>
                {onRowClick ? <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" /> : null}
              </div>
              {secondary.length ? (
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {secondary.map((c) => (
                    <div key={c.key} className="min-w-0">
                      <dt className="text-xs text-ink-muted">{c.header}</dt>
                      <dd className="min-w-0">{c.render(row)}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </>
          );
          return (
            <li key={rowKey(row)}>
              {onRowClick ? (
                <button type="button" onClick={() => onRowClick(row)} className="block w-full rounded-lg border border-line bg-surface p-4 text-left hover:bg-surface-2/60">
                  {body}
                </button>
              ) : (
                <div className="rounded-lg border border-line bg-surface p-4">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function textOf(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  if (node && typeof node === 'object' && 'props' in node) return textOf(node.props.children);
  return '';
}
