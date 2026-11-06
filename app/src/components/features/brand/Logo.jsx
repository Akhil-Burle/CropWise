import { cx } from '@/utils/browser';

export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 40 40" className={cx('h-9 w-9 shrink-0', className)} aria-hidden="true">
      <rect width="40" height="40" rx="10" className="fill-forest dark:fill-forest-deep" />
      <path d="M8 28c7 0 12-3 15-10" stroke="#F6F2E9" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M19 21c0-8 5-13 13-13 0 8-5 13-13 13z" fill="#C98B1C" />
      <path d="M6 32h28" stroke="#C26A2E" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ className, tagline, inverted = false }) {
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="leading-none">
        <span className={cx('block font-display text-xl font-semibold tracking-tight', inverted ? 'text-on-forest dark:text-ink' : 'text-ink')}>
          CropWise
        </span>
        {tagline ? (
          <span className={cx('mt-0.5 block text-[0.7rem] font-medium', inverted ? 'text-on-forest/75 dark:text-ink-muted' : 'text-ink-muted')}>
            {tagline}
          </span>
        ) : null}
      </span>
    </span>
  );
}
