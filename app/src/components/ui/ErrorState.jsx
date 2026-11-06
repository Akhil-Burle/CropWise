import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { cx } from '@/utils/browser';
import Button from './Button';

/** Uniform error block: translated message for the AppError code, plus retry when retryable. */
export default function ErrorState({ error, onRetry, compact = false, className, children }) {
  const { t } = useTranslation();
  const toMessage = useErrorMessage();
  const msg = toMessage(error);
  if (!msg) return null;
  return (
    <div
      role="alert"
      className={cx(
        'flex rounded-lg border border-danger/40 bg-danger/5',
        compact ? 'items-center gap-3 p-3' : 'flex-col items-center gap-3 px-6 py-8 text-center',
        className,
      )}
    >
      <AlertTriangle className={cx('shrink-0 text-danger', compact ? 'h-5 w-5' : 'h-9 w-9')} aria-hidden="true" />
      <div className={cx('min-w-0', compact && 'flex-1')}>
        <p className="font-semibold">{msg.title}</p>
        <p className="text-sm text-ink-muted">{msg.description}</p>
        {import.meta.env.DEV && error?.message && error.message !== error.code ? (
          <p className="mt-1 font-mono text-xs text-ink-muted/80">{error.code}: {error.message}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {onRetry && error?.retryable !== false ? (
          <Button variant="secondary" icon={RefreshCw} onClick={onRetry} size={compact ? 'sm' : 'md'}>
            {t('common.retry')}
          </Button>
        ) : null}
        {children}
      </div>
    </div>
  );
}
