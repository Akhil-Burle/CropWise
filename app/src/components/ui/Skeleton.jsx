import { useTranslation } from 'react-i18next';
import { cx } from '@/utils/browser';

export default function Skeleton({ className }) {
  return <div className={cx('skeleton', className)} aria-hidden="true" />;
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cx('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton h-3.5" style={{ width: `${92 - i * 14}%` }} />
      ))}
    </div>
  );
}

/** Screen-reader friendly loading block made of skeleton cards. */
export function SkeletonCards({ count = 3, className, cardClassName = 'h-36' }) {
  const { t } = useTranslation();
  return (
    <div className={cx('grid gap-4', className)} role="status" aria-label={t('common.loading')}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cx('skeleton rounded-lg', cardClassName)} />
      ))}
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
}
