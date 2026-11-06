import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/utils/format';
import { useLang } from '@/hooks/useLang';

/** Stylised map card. No tiles are fetched – this is a placeholder until a map provider is chosen. */
export default function MapPlaceholder({ name, location, seed = 1 }) {
  const { t } = useTranslation();
  const lang = useLang();
  const s = (n) => ((seed * 9301 + n * 49297) % 233280) / 233280;
  const plots = Array.from({ length: 6 }, (_, i) => ({ x: 10 + s(i) * 200, y: 10 + s(i + 7) * 90, w: 40 + s(i + 3) * 50, h: 24 + s(i + 5) * 26 }));
  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-[#E9E4D2] dark:bg-[#1c2a21]" role="img" aria-label={t('farms.mapAlt', { name })}>
      <svg viewBox="0 0 280 140" className="block h-36 w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {plots.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx="3" fill={i % 2 ? '#B9C99A' : '#CFC59E'} opacity="0.85" transform={`rotate(${(s(i + 11) - 0.5) * 18} ${p.x} ${p.y})`} />
        ))}
        {[30, 55, 80, 105].map((y, i) => (
          <path key={y} d={`M0 ${y} C 70 ${y - 18 + i * 3}, 150 ${y + 20}, 280 ${y - 6}`} stroke="#8C7B57" strokeOpacity="0.35" fill="none" />
        ))}
        <path d="M0 120 C 80 96, 160 132, 280 100" stroke="#6E9BC2" strokeWidth="5" strokeOpacity="0.55" fill="none" />
        <path d="M20 0 L 70 140" stroke="#FFFDF8" strokeWidth="4" strokeOpacity="0.8" />
      </svg>
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full text-clay">
        <MapPin className="h-8 w-8 fill-clay/30" aria-hidden="true" />
      </span>
      <span className="absolute bottom-2 left-2 rounded bg-surface/90 px-2 py-0.5 text-[11px] font-medium text-ink-muted">
        {location ? `${formatNumber(location.lat, lang, 3)}°N, ${formatNumber(location.lng, lang, 3)}°E` : t('farms.noLocation')}
      </span>
      <span className="absolute right-2 top-2 rounded bg-surface/90 px-2 py-0.5 text-[11px] font-semibold text-ink-muted">{t('farms.mapPlaceholder')}</span>
    </div>
  );
}
