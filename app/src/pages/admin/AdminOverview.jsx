import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, BookmarkCheck, Leaf, MapPin, PieChart as PieIcon, ScanLine, TrendingUp, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useChartColors, useMediaQuery } from '@/hooks/useEnvironment';
import { useLang } from '@/hooks/useLang';
import { Badge, Card, CardHeader, ErrorState, PageHeader, SkeletonCards, Stat } from '@/components/ui';
import { formatNumber } from '@/utils/format';

export default function AdminOverview() {
  const { t } = useTranslation();
  const lang = useLang();
  const c = useChartColors();
  const narrow = useMediaQuery('(max-width: 640px)');
  const q = useServiceQuery((s) => s.admin.getAnalytics(lang), [lang]);
  const tick = { fill: c['ink-muted'], fontSize: 11 };
  const tooltip = { background: c.surface, border: `1px solid ${c.line}`, borderRadius: 12, color: c.ink };
  const ADOPTION_COLOR = { chemical: c.chem, organic: c.organic, mixed: c.ochre, none: c.line };

  if (q.loading) return <SkeletonCards count={4} className="sm:grid-cols-2 xl:grid-cols-4" cardClassName="h-28" />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.reload} />;
  const a = q.data;

  return (
    <div>
      <PageHeader
        eyebrow={t('admin.eyebrow')}
        title={t('admin.title')}
        subtitle={t('admin.subtitle')}
        actions={a.isDemo ? <Badge tone="ochre">{t('admin.illustrative')}</Badge> : null}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Card><Stat label={t('admin.farmers')} value={formatNumber(a.totals.farmers, lang)} icon={Users} tone="forest" /></Card>
        <Card><Stat label={t('admin.analyses')} value={formatNumber(a.totals.analyses, lang)} icon={ScanLine} tone="clay" /></Card>
        <Card><Stat label={t('admin.saved')} value={formatNumber(a.totals.advisoriesSaved, lang)} icon={BookmarkCheck} tone="chem" /></Card>
        <Card><Stat label={t('admin.organicAdoption')} value={`${a.totals.organicAdoptionPct}%`} icon={Leaf} tone="organic" /></Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader icon={BarChart3} title={t('admin.byDisease')} />
          <div className="h-72" role="img" aria-label={t('admin.byDisease')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.byDisease} layout="vertical" margin={{ left: narrow ? 0 : 24, right: 16 }}>
                <CartesianGrid stroke={c.line} strokeDasharray="3 4" horizontal={false} />
                <XAxis type="number" tick={tick} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={tick} width={narrow ? 110 : 170} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltip} cursor={{ fill: c.line, opacity: 0.3 }} />
                <Bar dataKey="count" name={t('admin.cases')} fill={c.clay} radius={[0, 6, 6, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader icon={MapPin} title={t('admin.byDistrict')} />
          <div className="h-72" role="img" aria-label={t('admin.byDistrict')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.byDistrict} margin={{ left: -12, right: 8 }}>
                <CartesianGrid stroke={c.line} strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="district" tick={tick} tickLine={false} interval={0} angle={narrow ? -30 : 0} textAnchor={narrow ? 'end' : 'middle'} height={narrow ? 56 : 30} />
                <YAxis tick={tick} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltip} cursor={{ fill: c.line, opacity: 0.3 }} />
                <Bar dataKey="count" name={t('admin.analyses')} fill={c.forest} radius={[6, 6, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader icon={PieIcon} title={t('admin.adoption')} subtitle={t('admin.adoptionHint')} />
          <div className="h-72" role="img" aria-label={a.adoption.map((x) => `${t(`admin.adoptionLevel.${x.key}`)} ${x.value}%`).join(', ')}>
            <div className="h-full" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart accessibilityLayer={false}>
                <Pie data={a.adoption.map((x) => ({ ...x, name: t(`admin.adoptionLevel.${x.key}`) }))} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} isAnimationActive={false} rootTabIndex={-1}>
                  {a.adoption.map((x) => <Cell key={x.key} fill={ADOPTION_COLOR[x.key]} stroke={c.surface} />)}
                </Pie>
                <Tooltip contentStyle={tooltip} formatter={(v) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader icon={TrendingUp} title={t('admin.monthly')} />
          <div className="h-72" role="img" aria-label={t('admin.monthly')}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={a.monthly} margin={{ left: -12, right: 8 }}>
                <CartesianGrid stroke={c.line} strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="month" tick={tick} tickLine={false} />
                <YAxis tick={tick} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltip} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="analyses" name={t('admin.analyses')} stroke={c.clay} strokeWidth={2.5} isAnimationActive={false} />
                <Line type="monotone" dataKey="organicActions" name={t('admin.organicActions')} stroke={c.organic} strokeWidth={2.5} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
