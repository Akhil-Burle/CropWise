import { useId, useRef } from 'react';
import { cx } from '@/utils/browser';

/**
 * Accessible tablist with arrow-key navigation. Renders only the tab buttons;
 * pair each panel with `tabPanelProps(id)` for aria wiring.
 */
export default function Tabs({ tabs, value, onChange, label, className, tone = 'default', idBase }) {
  const autoId = useId();
  const base = idBase ?? autoId;
  const refs = useRef([]);

  const onKeyDown = (e, index) => {
    let next = null;
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = tabs.length - 1;
    if (next !== null) {
      e.preventDefault();
      onChange(tabs[next].id);
      refs.current[next]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cx('flex gap-1 overflow-x-auto rounded-lg bg-surface-2 p-1 scrollbar-thin', className)}
    >
      {tabs.map((tab, i) => {
        const selected = tab.id === value;
        const Icon = tab.icon;
        const activeTone =
          tone === 'compare' && tab.tone === 'chem'
            ? 'bg-chem text-white dark:text-forest-deep'
            : tone === 'compare' && tab.tone === 'organic'
              ? 'bg-organic text-white dark:text-forest-deep'
              : 'bg-surface text-ink shadow-sm';
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${base}-tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={`${base}-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cx(
              'flex min-h-touch flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-semibold transition-colors',
              selected ? activeTone : 'text-ink-muted hover:text-ink',
            )}
          >
            {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
            {tab.label}
            {tab.badge !== undefined ? (
              <span className="rounded-full bg-ink/10 px-1.5 text-xs tabular">{tab.badge}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export const tabPanelProps = (base, id, value) => ({
  id: `${base}-panel-${id}`,
  role: 'tabpanel',
  'aria-labelledby': `${base}-tab-${id}`,
  hidden: value !== id,
  tabIndex: 0,
});
