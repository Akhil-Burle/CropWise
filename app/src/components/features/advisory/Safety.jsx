import { Clock, Footprints, Glasses, Hand, HardHat, Shield, Shirt, Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui';
import { cx } from '@/utils/browser';

export const PPE_ICONS = { gloves: Hand, mask: Shield, goggles: Glasses, coverall: Shirt, boots: Footprints, cap: HardHat };

const TOX_FILL = { red: '#C62828', yellow: '#F2C200', blue: '#1565C0', green: '#2E7D32' };
const TOX_TEXT = { red: 'text-white', yellow: 'text-black', blue: 'text-white', green: 'text-white' };

/** Diamond label as printed on Indian pesticide packs: the lower triangle carries the toxicity colour. */
export function ToxicityDiamond({ toxClass, className }) {
  return (
    <svg viewBox="0 0 60 60" className={cx('h-14 w-14 shrink-0', className)} aria-hidden="true">
      <path d="M30 2 L58 30 L30 58 L2 30 Z" fill="#fff" stroke="#111" strokeWidth="2" />
      <path d="M2 30 L58 30 L30 58 Z" fill={TOX_FILL[toxClass]} stroke="#111" strokeWidth="2" />
    </svg>
  );
}

/** Strictly semantic toxicity band – the only place toxicity colours appear. */
export function ToxicityBand({ toxicity }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 overflow-hidden rounded-lg border-2" style={{ borderColor: TOX_FILL[toxicity.class] }}>
      <div className={cx('flex items-center gap-3 self-stretch px-3 py-2', TOX_TEXT[toxicity.class])} style={{ background: TOX_FILL[toxicity.class] }}>
        <ToxicityDiamond toxClass={toxicity.class} className="h-10 w-10" />
      </div>
      <div className="min-w-0 py-2 pr-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{t('advisory.toxicityClass')}</p>
        <p className="font-bold">{toxicity.label}</p>
        <p className="text-sm text-ink-muted">{toxicity.description}</p>
      </div>
    </div>
  );
}

export function PhiBadge({ days, reentryHours }) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-lg border-2 border-danger/50 bg-danger/5 p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-danger">
          <Clock className="h-4 w-4" aria-hidden="true" /> {t('advisory.phiShort')}
        </p>
        <p className="mt-1 font-display text-2xl font-bold tabular">{t('advisory.days', { count: days })}</p>
        <p className="text-xs text-ink-muted">{t('advisory.phiExplain')}</p>
      </div>
      <div className="rounded-lg border-2 border-warn/50 bg-warn/5 p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-warn">
          <Timer className="h-4 w-4" aria-hidden="true" /> {t('advisory.reentry')}
        </p>
        <p className="mt-1 font-display text-2xl font-bold tabular">{reentryHours !== null ? t('advisory.hours', { count: reentryHours }) : '—'}</p>
        <p className="text-xs text-ink-muted">{t('advisory.reentryExplain')}</p>
      </div>
    </div>
  );
}

export function PpeChecklist({ items, checked, onToggle }) {
  const { t } = useTranslation();
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{t('advisory.ppeTitle')}</legend>
      <ul className="grid gap-1 sm:grid-cols-2">
        {items.map((p) => {
          const Icon = PPE_ICONS[p.icon];
          return (
            <li key={p.id} className="flex items-center gap-2 rounded-md bg-surface-2/60 pl-3">
              <Icon className="h-5 w-5 shrink-0 text-chem" aria-hidden="true" />
              <Checkbox checked={Boolean(checked[p.id])} onChange={() => onToggle(p.id)} label={p.label} tone="chem" className="flex-1" />
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
