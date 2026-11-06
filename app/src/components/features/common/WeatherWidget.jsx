import { Cloud, CloudLightning, CloudRain, CloudSun, Droplets, Sun, Wind } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, Card, ErrorState, Skeleton } from '@/components/ui';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useLang } from '@/hooks/useLang';
import { formatWeekday } from '@/utils/format';
import { cx } from '@/utils/browser';

export const WEATHER_ICON = { sunny: Sun, partly_cloudy: CloudSun, cloudy: Cloud, rain: CloudRain, storm: CloudLightning };

export default function WeatherWidget({ farmId }) {
  const { t } = useTranslation();
  const lang = useLang();
  const q = useServiceQuery((s) => s.weather.getForFarm(farmId, lang), [farmId, lang], { enabled: Boolean(farmId) });

  if (q.loading) return <Skeleton className="h-64 rounded-lg" />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.reload} compact />;
  const w = q.data;
  if (!w) return null;
  const Icon = WEATHER_ICON[w.condition];

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="bg-gradient-to-br from-forest/10 to-ochre/10 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink-muted">{t('weather.title')}</p>
            <p className="text-sm text-ink-muted">{w.location}</p>
          </div>
          {w.isDemo ? <Badge tone="ochre" size="sm">{t('demo.badge')}</Badge> : null}
        </div>
        <div className="mt-2 flex items-center gap-4">
          <Icon className="h-12 w-12 text-clay" aria-hidden="true" />
          <div>
            <p className="font-display text-4xl font-semibold tabular">{w.tempC}°C</p>
            <p className="text-sm">{t(`weather.condition.${w.condition}`)}</p>
          </div>
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <div><dt className="flex items-center gap-1 text-ink-muted"><Droplets className="h-4 w-4" aria-hidden="true" />{t('weather.humidity')}</dt><dd className="font-semibold tabular">{w.humidityPct}%</dd></div>
          <div><dt className="flex items-center gap-1 text-ink-muted"><CloudRain className="h-4 w-4" aria-hidden="true" />{t('weather.rain')}</dt><dd className="font-semibold tabular">{w.rainChancePct}%</dd></div>
          <div><dt className="flex items-center gap-1 text-ink-muted"><Wind className="h-4 w-4" aria-hidden="true" />{t('weather.wind')}</dt><dd className="font-semibold tabular">{w.windKph} km/h</dd></div>
        </dl>
      </div>
      <div className={cx('mx-5 mt-4 rounded-lg border-l-4 p-3 text-sm', w.sprayWindow.ok ? 'border-success bg-success/5' : 'border-warn bg-warn/10')}>
        <p className="font-semibold">{w.sprayWindow.ok ? t('weather.sprayOk') : t('weather.sprayWait')}</p>
        <p className="text-ink-muted">{w.sprayWindow.message}</p>
      </div>
      <ul className="grid grid-cols-5 gap-1 p-5 pt-4 text-center text-xs">
        {w.forecast.map((d) => {
          const DIcon = WEATHER_ICON[d.condition];
          return (
            <li key={d.date} className="rounded-md bg-surface-2/60 py-2">
              <p className="font-semibold">{formatWeekday(d.date, lang)}</p>
              <DIcon className="mx-auto my-1 h-5 w-5 text-ink-muted" aria-label={t(`weather.condition.${d.condition}`)} />
              <p className="tabular">{d.maxC}° / {d.minC}°</p>
              <p className="tabular text-info">{d.rainChancePct}%</p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
