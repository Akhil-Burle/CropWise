import { ArrowRight, BookOpen, CalendarDays, FlaskConical, Languages, Leaf, Microscope, Recycle, ScanLine, ShieldCheck, TestTube, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from '@/components/ui/motion';
import { useAuthStore } from '@/store/authStore';
import { config } from '@/config';
import { Badge, Button } from '@/components/ui';
import Logo from '@/components/features/brand/Logo';
import { LanguageSwitcher, ThemeToggle } from '@/components/features/layout/Controls';
import { cx } from '@/utils/browser';

function HeroVisual() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const rise = (delay) => (reduce ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.5 } });
  const rows = [
    { k: 'N', v: '182', w: '32%', tone: 'bg-status-deficient', s: t('soil.status.deficient') },
    { k: 'P', v: '18.4', w: '58%', tone: 'bg-status-sufficient', s: t('soil.status.sufficient') },
    { k: 'K', v: '236', w: '62%', tone: 'bg-status-sufficient', s: t('soil.status.sufficient') },
    { k: 'OC', v: '0.41%', w: '30%', tone: 'bg-status-deficient', s: t('soil.status.deficient') },
  ];
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-md sm:h-[460px]" aria-hidden="true">
      <motion.div {...rise(0.1)} className="absolute left-0 top-4 w-[78%] -rotate-3 rounded-xl border border-line bg-surface p-4 shadow-pop">
        <p className="text-xs font-semibold uppercase tracking-wider text-clay">{t('landing.visual.card')}</p>
        <ul className="mt-3 space-y-2.5">
          {rows.map((r) => (
            <li key={r.k} className="grid grid-cols-[2rem_1fr_auto] items-center gap-2 text-sm">
              <span className="font-bold">{r.k}</span>
              <span className="h-2 rounded-full bg-surface-2"><span className={cx('block h-2 rounded-full', r.tone)} style={{ width: r.w }} /></span>
              <span className="tabular text-xs text-ink-muted">{r.v}</span>
            </li>
          ))}
        </ul>
      </motion.div>
      <motion.div {...rise(0.25)} className="absolute right-0 top-28 grid h-36 w-36 place-items-center rounded-full border-4 border-surface bg-gradient-to-br from-organic/30 to-forest/40 shadow-pop">
        <Leaf className="h-16 w-16 text-forest" />
        <span className="absolute -bottom-2 rounded-full bg-surface px-3 py-1 text-xs font-bold text-clay shadow-card">91%</span>
      </motion.div>
      <motion.div {...rise(0.4)} className="absolute bottom-0 left-4 right-2 grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
        <div className="border-r border-line p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-chem"><FlaskConical className="h-4 w-4" />{t('advisory.chemicalShort')}</p>
          <p className="mt-2 font-display text-xl font-semibold">600 g</p>
          <p className="text-xs text-ink-muted">{t('landing.visual.perAcre')}</p>
          <p className="mt-2 inline-block rounded bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">PHI 7 {t('landing.visual.days')}</p>
        </div>
        <div className="p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-organic"><Leaf className="h-4 w-4" />{t('advisory.organicShort')}</p>
          <p className="mt-2 font-display text-xl font-semibold">NSKE 5%</p>
          <p className="text-xs text-ink-muted">+ Trichoderma</p>
          <p className="mt-2 inline-block rounded bg-organic-soft px-2 py-0.5 text-xs font-semibold text-organic">{t('landing.visual.preventive')}</p>
        </div>
      </motion.div>
    </div>
  );
}

export default function Landing() {
  const { t } = useTranslation();
  const status = useAuthStore((s) => s.status);
  const signedIn = status === 'authenticated';
  const appLink = signedIn ? '/app' : '/login';

  const steps = [
    { icon: TestTube, title: t('landing.step1'), text: t('landing.step1Text') },
    { icon: ScanLine, title: t('landing.step2'), text: t('landing.step2Text') },
    { icon: ShieldCheck, title: t('landing.step3'), text: t('landing.step3Text') },
  ];
  const features = [
    { icon: Microscope, title: t('landing.f.diagnosis'), text: t('landing.f.diagnosisText') },
    { icon: FlaskConical, title: t('landing.f.safety'), text: t('landing.f.safetyText') },
    { icon: Leaf, title: t('landing.f.organic'), text: t('landing.f.organicText') },
    { icon: Recycle, title: t('landing.f.transition'), text: t('landing.f.transitionText') },
    { icon: CalendarDays, title: t('landing.f.tracker'), text: t('landing.f.trackerText') },
    { icon: Languages, title: t('landing.f.language'), text: t('landing.f.languageText') },
  ];
  const years = [
    { y: 1, chem: 75, org: 25 },
    { y: 2, chem: 40, org: 60 },
    { y: 3, chem: 0, org: 100 },
  ];
  const stats = [
    { v: '30–40%', l: t('landing.stat1') },
    { v: '0.41 → 0.80%', l: t('landing.stat2') },
    { v: '3', l: t('landing.stat3') },
    { v: '1800-180-1551', l: t('landing.stat4') },
  ];

  return (
    <div className="min-h-screen bg-bg paper-grain">
      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-3">
        {t('common.skipToContent')}
      </a>
      <header className="mx-auto flex max-w-content items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Logo tagline={t('brand.tagline')} />
        <div className="flex-1" />
        <LanguageSwitcher compact className="sm:hidden" />
        <LanguageSwitcher className="hidden sm:block" />
        <ThemeToggle className="hidden sm:grid" />
        <Button to={appLink} variant="secondary" className="hidden sm:inline-flex">{signedIn ? t('landing.openApp') : t('auth.login')}</Button>
      </header>

      <main id="content">
        <section className="mx-auto grid max-w-content items-center gap-10 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pt-12">
          <div>
            <Badge tone="clay">{t('landing.eyebrow')}</Badge>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.1] sm:text-5xl lg:text-6xl">{t('landing.title')}</h1>
            <p className="mt-5 max-w-xl text-lg text-ink-muted">{t('landing.subtitle')}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to={appLink} size="lg" iconRight={ArrowRight}>{signedIn ? t('landing.openApp') : t('landing.cta')}</Button>
              <Button href="#how" size="lg" variant="secondary">{t('landing.how')}</Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
              <li className="flex items-center gap-2"><Languages className="h-4 w-4 text-forest" aria-hidden="true" />English · हिन्दी · ಕನ್ನಡ</li>
              <li className="flex items-center gap-2"><Volume2 className="h-4 w-4 text-forest" aria-hidden="true" />{t('landing.readAloud')}</li>
              <li className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-forest" aria-hidden="true" />{t('landing.offline')}</li>
            </ul>
          </div>
          <HeroVisual />
        </section>

        <section id="how" className="border-y border-line bg-surface/70 py-16">
          <div className="mx-auto max-w-content px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-clay">{t('landing.howEyebrow')}</p>
            <h2 className="mt-1 text-3xl font-semibold sm:text-4xl">{t('landing.howTitle')}</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {steps.map((s, i) => {
                const Icon = s.icon;
                return (
                  <li key={s.title} className="relative rounded-xl border border-line bg-surface p-6">
                    <span className="font-display text-5xl font-semibold text-ochre/60">{i + 1}</span>
                    <Icon className="absolute right-6 top-6 h-8 w-8 text-forest" aria-hidden="true" />
                    <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
                    <p className="mt-2 text-ink-muted">{s.text}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold sm:text-4xl">{t('landing.featuresTitle')}</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <li key={f.title} className="rounded-xl border border-line bg-surface p-6">
                  <span className="grid h-12 w-12 place-items-center rounded-lg bg-forest/10 text-forest" aria-hidden="true"><Icon className="h-6 w-6" /></span>
                  <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-1 text-ink-muted">{f.text}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="bg-forest-deep py-16 text-on-forest field-lines dark:bg-surface-2 dark:text-ink">
          <div className="mx-auto grid max-w-content gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-ochre">{t('landing.whyEyebrow')}</p>
              <h2 className="mt-1 text-3xl font-semibold text-on-forest dark:text-ink sm:text-4xl">{t('landing.whyTitle')}</h2>
              <p className="mt-4 text-on-forest/85 dark:text-ink-muted">{t('landing.whyText1')}</p>
              <p className="mt-3 text-on-forest/85 dark:text-ink-muted">{t('landing.whyText2')}</p>
            </div>
            <ol className="space-y-4">
              {years.map((y) => (
                <li key={y.y} className="rounded-xl bg-surface p-5 text-ink">
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="font-display text-lg font-semibold">{t('transition.year', { n: y.y })}</span>
                    <span className="text-sm text-ink-muted">{t(`landing.year${y.y}`)}</span>
                  </div>
                  <div className="flex h-8 overflow-hidden rounded-md text-xs font-bold">
                    {y.chem ? <span className="flex items-center bg-chem px-2 text-white dark:text-forest-deep" style={{ width: `${y.chem}%` }}>{y.chem}%</span> : null}
                    <span className="flex flex-1 items-center justify-end bg-organic px-2 text-white dark:text-forest-deep">{y.org}%</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-semibold sm:text-4xl">{t('landing.impactTitle')}</h2>
            <Badge tone="ochre">{t('landing.illustrative')}</Badge>
          </div>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.l} className="rounded-xl border border-line bg-surface p-6">
                <dt className="text-sm text-ink-muted">{s.l}</dt>
                <dd className="mt-1 font-display text-3xl font-semibold tabular text-forest">{s.v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-ink-muted">{t('landing.impactNote')}</p>
        </section>

        <section className="mx-auto max-w-content px-4 pb-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start gap-6 rounded-xl bg-clay p-8 text-white dark:text-forest-deep sm:flex-row sm:items-center">
            <div className="flex-1">
              <h2 className="text-3xl font-semibold text-inherit">{t('landing.ctaTitle')}</h2>
              <p className="mt-2 opacity-90">{config.flags.demoMode ? t('landing.ctaTextDemo') : t('landing.ctaText')}</p>
            </div>
            <Button to={appLink} size="lg" variant="secondary" iconRight={ArrowRight}>{signedIn ? t('landing.openApp') : t('landing.cta')}</Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-content gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <Logo tagline={t('brand.tagline')} />
            <p className="mt-3 text-sm text-ink-muted">{t('landing.footerAbout')}</p>
          </div>
          <div>
            <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-ink-muted">{t('landing.project')}</h2>
            <p className="mt-2 font-semibold">RV Institute of Technology and Management</p>
            <p className="text-sm text-ink-muted">{t('landing.vtu')}</p>
            <p className="text-sm text-ink-muted">{t('landing.projectType')}</p>
          </div>
          <div>
            <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-ink-muted">{t('landing.team')}</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {[1, 2, 3, 4].map((n) => <li key={n}>{t('landing.teamMember', { n })}</li>)}
              <li className="pt-1 text-ink-muted">{t('landing.guide')}</li>
            </ul>
          </div>
        </div>
        <p className="border-t border-line px-4 py-4 text-center text-xs text-ink-muted">{t('landing.disclaimer')}</p>
      </footer>
    </div>
  );
}
