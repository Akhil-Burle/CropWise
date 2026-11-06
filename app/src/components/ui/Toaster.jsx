import { AnimatePresence, motion } from '@/components/ui/motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/store/toastStore';
import { cx } from '@/utils/browser';

const ICON = { success: CheckCircle2, error: XCircle, info: Info, warning: AlertTriangle };
const TONE = {
  success: 'border-success/50 text-success',
  error: 'border-danger/60 text-danger',
  info: 'border-info/50 text-info',
  warning: 'border-warn/60 text-warn',
};

export default function Toaster() {
  const { t } = useTranslation();
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:pr-6"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = ICON[toast.tone];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              className={cx(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border-l-4 bg-surface p-3 pr-1 shadow-pop',
                TONE[toast.tone],
              )}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1 text-ink">
                <p className="font-semibold">{toast.title}</p>
                {toast.description ? <p className="text-sm text-ink-muted">{toast.description}</p> : null}
              </div>
              <button
                type="button"
                className="grid min-h-touch min-w-touch place-items-center rounded-md text-ink-muted hover:bg-surface-2"
                onClick={() => dismiss(toast.id)}
                aria-label={t('common.dismiss')}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
