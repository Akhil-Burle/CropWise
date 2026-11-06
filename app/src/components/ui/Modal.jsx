import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from '@/components/ui/motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cx } from '@/utils/browser';

const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

/** Dialog with focus trap, Esc-to-close and focus return. `variant="sheet"` docks to the bottom on mobile. */
export default function Modal({ open, onClose, title, description, children, footer, size = 'md', variant = 'dialog', dismissible = true }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const panelRef = useRef(null);
  const lastFocus = useRef(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return undefined;
    lastFocus.current = document.activeElement;
    const panel = panelRef.current;
    const first = panel?.querySelector(FOCUSABLE);
    (first ?? panel)?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' && dismissible) {
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'Tab' && panel) {
        const items = [...panel.querySelectorAll(FOCUSABLE)];
        if (items.length === 0) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      lastFocus.current?.focus?.();
    };
  }, [open, onClose, dismissible]);

  const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };
  const sheet = variant === 'sheet';

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className={cx('fixed inset-0 z-[70] flex justify-center', sheet ? 'items-end sm:items-center' : 'items-end sm:items-center')}>
          <motion.div
            className="absolute inset-0 bg-forest-deep/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissible ? onClose : undefined}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={cx(
              'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-xl bg-surface shadow-pop sm:rounded-xl',
              widths[size],
            )}
          >
            <div className="flex items-start gap-3 border-b border-line px-5 py-4">
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="text-xl font-semibold">
                  {title}
                </h2>
                {description ? (
                  <p id={descId} className="mt-1 text-sm text-ink-muted">
                    {description}
                  </p>
                ) : null}
              </div>
              {dismissible ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="grid min-h-touch min-w-touch place-items-center rounded-md text-ink-muted hover:bg-surface-2 hover:text-ink"
                  aria-label={t('common.close')}
                  title={t('common.close')}
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface-2/50 px-5 py-3 safe-bottom">{footer}</div> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
