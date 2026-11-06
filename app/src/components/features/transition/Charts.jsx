import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useChartColors, useMediaQuery } from '@/hooks/useEnvironment';
import { useLang } from '@/hooks/useLang';
import { formatCompactCurrency, formatCurrency, formatNumber } from '@/utils/format';

function useAxis() {
  const c = useChartColors();
  const narrow = useMediaQuery('(max-width: 640px)');
  return {
    c,
    narrow,
    tick: { fill: c['ink-muted'], fontSize: narrow ? 10 : 12 },
    grid: <CartesianGrid stroke={c.line} strokeDasharray="3 4" vertical={false} />,
    tooltipStyle: { background: c.surface, border: `1px solid ${c.line}`, borderRadius: 12, color: c.ink, fontSize: 13 },
  };
}

export function RoiChart({ data, breakEven, currency }) {
  const { t } = useTranslation();
  const lang = useLang();
  const { c, tick, grid, tooltipStyle, narrow } = useAxis();
  return (
    <div className="h-72 w-full" role="img" aria-label={t('transition.roiAria', { label: breakEven?.label ?? t('transition.notInPlan') })}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 12, left: narrow ? -8 : 8, bottom: 0 }}>
          {grid}
          <XAxis dataKey="label" tick={tick} interval="preserveStartEnd" tickLine={false} axisLine={{ stroke: c.line }} />
          <YAxis tick={tick} tickFormatter={(v) => formatCompactCurrency(v, currency, lang)} width={narrow ? 52 : 64} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [formatCurrency(v, currency, lang), name]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {breakEven ? (
            <ReferenceLine x={breakEven.label} stroke={c.ochre} strokeWidth={2} strokeDasharray="4 3" label={{ value: t('transition.breakEven'), position: 'insideTopRight', fill: c.clay, fontSize: 12, fontWeight: 600 }} />
          ) : null}
          <Line type="monotone" dataKey="chemical" name={t('transition.stayChemical')} stroke={c.chem} strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 3 }} isAnimationActive={false} />
          <Line type="monotone" dataKey="organic" name={t('transition.transitionLine')} stroke={c.organic} strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function YieldChart({ data }) {
  const { t } = useTranslation();
  const lang = useLang();
  const { c, tick, grid, tooltipStyle, narrow } = useAxis();
  const min = Math.floor(Math.min(...data.map((d) => d.transition)) - 4);
  return (
    <div className="h-64 w-full" role="img" aria-label={t('transition.yieldAria')}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 12, left: narrow ? -16 : 0, bottom: 0 }}>
          <defs>
            <linearGradient id="yieldFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.organic} stopOpacity={0.35} />
              <stop offset="100%" stopColor={c.organic} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {grid}
          <XAxis dataKey="label" tick={tick} interval="preserveStartEnd" tickLine={false} axisLine={{ stroke: c.line }} />
          <YAxis domain={[min, 'auto']} tick={tick} tickLine={false} axisLine={false} width={40} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [formatNumber(v, lang, 1), name]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="chemical" name={t('transition.yieldBaseline')} stroke={c.chem} strokeDasharray="6 4" fill="none" strokeWidth={2} isAnimationActive={false} />
          <Area type="monotone" dataKey="transition" name={t('transition.yieldTransition')} stroke={c.organic} fill="url(#yieldFill)" strokeWidth={3} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SocChart({ data, target, reachedLabel }) {
  const { t } = useTranslation();
  const lang = useLang();
  const { c, tick, grid, tooltipStyle, narrow } = useAxis();
  const max = Math.max(target + 0.1, ...data.map((d) => d.value + 0.05));
  const min = Math.max(0, Math.min(...data.map((d) => d.value)) - 0.1);
  return (
    <div className="h-64 w-full" role="img" aria-label={t('transition.socAria', { target, label: reachedLabel ?? t('transition.notInPlan') })}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 12, left: narrow ? -16 : 0, bottom: 0 }}>
          {grid}
          <XAxis dataKey="label" tick={tick} interval="preserveStartEnd" tickLine={false} axisLine={{ stroke: c.line }} />
          <YAxis domain={[Number(min.toFixed(2)), Number(max.toFixed(2))]} tick={tick} tickFormatter={(v) => `${formatNumber(v, lang, 2)}%`} width={48} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${formatNumber(v, lang, 2)}%`, t('transition.soc')]} />
          <ReferenceLine y={target} stroke={c.sufficient} strokeWidth={2} strokeDasharray="5 4" label={{ value: t('transition.socTargetLine', { target }), position: 'insideTopLeft', fill: c.sufficient, fontSize: 12, fontWeight: 600 }} />
          <Line type="monotone" dataKey="value" name={t('transition.soc')} stroke={c.clay} strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
