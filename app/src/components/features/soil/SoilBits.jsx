import { ArrowDown, ArrowUp, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, Gauge } from '@/components/ui';
import { useLang } from '@/hooks/useLang';
import { formatNumber } from '@/utils/format';
import { cx } from '@/utils/browser';

const STATUS_ICON = { deficient: ArrowDown, sufficient: Check, excess: ArrowUp };

/** Deficient / Sufficient / Excess chip. Colour is never the only signal: icon + word always shown. */
export function StatusChip({ status, statusLabel, size = 'md' }) {
  const { t } = useTranslation();
  if (!status) return <Badge size={size}>{t('soil.status.unknown')}</Badge>;
  return (
    <Badge tone={status} icon={STATUS_ICON[status]} size={size}>
      {t(`soil.status.${status}`)}
      {statusLabel ? <span className="font-medium">· {statusLabel}</span> : null}
    </Badge>
  );
}

export function rangeText(t, range, unit, lang) {
  const u = unit ? ` ${unit}` : '';
  if (range.low !== null && range.high !== null) return t('soil.rangeBetween', { low: formatNumber(range.low, lang), high: formatNumber(range.high, lang), unit: u });
  if (range.high !== null) return t('soil.rangeBelow', { high: formatNumber(range.high, lang), unit: u });
  if (range.low !== null) return t('soil.rangeAbove', { low: formatNumber(range.low, lang), unit: u });
  return '';
}

export function NutrientRow({ value: v, compact = false }) {
  const { t } = useTranslation();
  const lang = useLang();
  const name = t(`soil.nutrient.${v.key}`);
  const valueText = v.value === null ? '—' : `${formatNumber(v.value, lang)}${v.unit ? ` ${v.unit}` : ''}`;
  const scaleMax = v.range.high ? v.range.high * 1.6 : v.range.low ? v.range.low * 2 : undefined;
  return (
    <div className={cx('grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5', !compact && 'py-2')}>
      <div className="min-w-0">
        <p className="truncate font-semibold">{name}</p>
        {!compact ? <p className="text-xs text-ink-muted">{t('soil.normal')}: {rangeText(t, v.range, v.unit, lang)}</p> : null}
      </div>
      <p className="text-right font-display text-lg font-semibold tabular">{valueText}</p>
      <Gauge
        value={v.value}
        low={v.range.low}
        high={v.range.high}
        max={scaleMax}
        status={v.status}
        label={name}
        valueText={`${valueText}, ${v.status ? t(`soil.status.${v.status}`) : ''}`}
        className="col-span-1 self-center"
      />
      <div className="justify-self-end">
        <StatusChip status={v.status} statusLabel={v.statusLabel} size="sm" />
      </div>
    </div>
  );
}

export function SoilSnapshot({ report, compact = false }) {
  return (
    <div className={cx(compact ? 'space-y-3' : 'divide-y divide-line')}>
      {report.values.map((v) => (
        <NutrientRow key={v.key} value={v} compact={compact} />
      ))}
    </div>
  );
}
