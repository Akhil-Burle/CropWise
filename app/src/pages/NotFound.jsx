import { Home, Sprout } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import Logo from '@/components/features/brand/Logo';

export default function NotFound({ inApp = false }) {
  const { t } = useTranslation();
  const body = (
    <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
      <svg viewBox="0 0 220 120" className="mb-6 w-64" aria-hidden="true">
        <path d="M0 100 C 50 90, 90 108, 140 96 S 200 92, 220 98 L220 120 L0 120 Z" className="fill-clay/30" />
        <path d="M0 108 C 60 100, 120 116, 220 106 L220 120 L0 120 Z" className="fill-clay/50" />
        <text x="110" y="78" textAnchor="middle" className="fill-forest font-display" fontSize="64" fontWeight="700">404</text>
      </svg>
      <Sprout className="mb-2 h-8 w-8 text-organic" aria-hidden="true" />
      <h1 className="text-3xl font-semibold">{t('notFound.title')}</h1>
      <p className="mt-2 text-ink-muted">{t('notFound.text')}</p>
      <Button to={inApp ? '/app' : '/'} icon={Home} className="mt-6">
        {inApp ? t('nav.dashboard') : t('notFound.home')}
      </Button>
    </div>
  );
  if (inApp) return body;
  return (
    <div className="min-h-screen bg-bg paper-grain px-4">
      <header className="mx-auto max-w-content py-5">
        <Logo />
      </header>
      {body}
    </div>
  );
}
