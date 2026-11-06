import { Link } from 'react-router-dom';
import { Leaf, ShieldCheck, TestTube } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Logo from '../brand/Logo';
import { DemoBanner } from '../layout/Banners';
import { LanguageSwitcher, ThemeToggle } from '../layout/Controls';

export default function AuthLayout({ title, subtitle, children }) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-bg lg:grid lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-forest-deep p-10 text-on-forest field-lines lg:flex dark:bg-surface-2 dark:text-ink">
        <Link to="/" aria-label={t('notFound.home')}>
          <Logo inverted tagline={t('brand.tagline')} />
        </Link>
        <div>
          <p className="font-display text-4xl font-semibold leading-tight text-on-forest dark:text-ink">{t('auth.sideTitle')}</p>
          <ul className="mt-6 space-y-3 text-on-forest/85 dark:text-ink-muted">
            <li className="flex gap-3"><TestTube className="h-5 w-5 shrink-0 text-ochre" aria-hidden="true" />{t('auth.side1')}</li>
            <li className="flex gap-3"><Leaf className="h-5 w-5 shrink-0 text-ochre" aria-hidden="true" />{t('auth.side2')}</li>
            <li className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-ochre" aria-hidden="true" />{t('auth.side3')}</li>
          </ul>
        </div>
        <p className="text-sm text-on-forest/60 dark:text-ink-muted">RV Institute of Technology and Management · VTU</p>
      </aside>
      <div className="flex min-h-screen flex-col paper-grain">
        <DemoBanner />
        <div className="flex items-center gap-2 px-4 py-4 sm:px-8">
          <Link to="/" className="lg:invisible" aria-label={t('notFound.home')}>
            <Logo />
          </Link>
          <div className="flex-1" />
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <main className="flex flex-1 items-start justify-center px-4 pb-12 pt-4 sm:items-center sm:px-8">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-semibold">{title}</h1>
            {subtitle ? <p className="mt-2 text-ink-muted">{subtitle}</p> : null}
            <div className="mt-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
