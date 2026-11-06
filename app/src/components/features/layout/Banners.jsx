import { FlaskConical, WifiOff, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { useOnlineStatus } from '@/hooks/useEnvironment';
import { usePrefs } from '@/store/prefsStore';

/** Visible only with the mock data source. */
export function DemoBanner() {
  const { t } = useTranslation();
  const dismissed = usePrefs((s) => s.demoBannerDismissed);
  const dismiss = usePrefs((s) => s.dismissDemoBanner);
  if (!config.flags.demoBanner || dismissed) return null;
  return (
    <div className="no-print flex items-center gap-3 bg-ochre/20 px-4 py-1.5 text-sm text-ink" role="note">
      <FlaskConical className="h-4 w-4 shrink-0 text-clay" aria-hidden="true" />
      <p className="flex-1">
        <strong className="font-semibold">{t('demo.bannerTitle')}</strong> {t('demo.bannerText')}
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="grid min-h-[40px] min-w-[40px] place-items-center rounded-md hover:bg-ochre/20"
        aria-label={t('common.dismiss')}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function OfflineBanner() {
  const { t } = useTranslation();
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="no-print flex items-center gap-3 bg-ink px-4 py-2 text-sm text-bg" role="status">
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <p>
        <strong>{t('offline.title')}</strong> {t('offline.text')}
      </p>
    </div>
  );
}
