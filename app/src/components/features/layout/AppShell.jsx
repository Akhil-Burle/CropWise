import { Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { HelpCircle, LogOut, MoreHorizontal, PlayCircle, Settings, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { useAuthStore, hasRole } from '@/store/authStore';
import { useDemo } from '@/store/demoStore';
import { usePrefs } from '@/store/prefsStore';
import { useAuthActions } from '@/hooks/useAuth';
import { cx } from '@/utils/browser';
import { initials } from '@/utils/format';
import { Modal, SkeletonCards } from '@/components/ui';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import Logo, { LogoMark } from '../brand/Logo';
import { DemoBanner, OfflineBanner } from './Banners';
import { LanguageSwitcher, ThemeToggle } from './Controls';
import { BOTTOM_ITEMS, FARMER_EXTRA, FARMER_NAV, NAV_GROUPS, SETTINGS_ITEM } from './navigation';
import { useIsFarmer } from '@/store/authStore';
import DemoController from '../demo/DemoController';
import TourOverlay from '../tour/TourOverlay';

function useVisibleGroups() {
  const user = useAuthStore((s) => s.user);
  const isFarmer = useIsFarmer();
  if (isFarmer) return [{ id: 'work', items: FARMER_NAV }, { id: 'plan', items: FARMER_EXTRA }];
  return NAV_GROUPS.filter((g) => !g.roles || hasRole(user, g.roles));
}

function SideNavItem({ item }) {
  const { t } = useTranslation();
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      data-tour={item.tour}
      className={({ isActive }) =>
        cx(
          'group relative flex min-h-touch items-center gap-3 rounded-md px-3 text-[0.95rem] font-medium transition-colors',
          isActive
            ? 'bg-on-forest/10 text-on-forest dark:bg-surface dark:text-ink'
            : 'text-on-forest/80 hover:bg-on-forest/5 hover:text-on-forest dark:text-ink-muted dark:hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cx('absolute left-0 top-2 bottom-2 w-1 rounded-r-full', isActive ? 'bg-ochre' : 'bg-transparent')} aria-hidden="true" />
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="truncate">{t(item.labelKey)}</span>
        </>
      )}
    </NavLink>
  );
}

function Sidebar() {
  const { t } = useTranslation();
  const groups = useVisibleGroups();
  return (
    <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-forest-deep text-on-forest field-lines lg:flex dark:border-r dark:border-line dark:text-ink">
      <div className="px-5 pb-4 pt-5">
        <Logo inverted tagline={t('brand.tagline')} />
      </div>
      <nav aria-label={t('nav.main')} className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
        {groups.map((g) => (
          <div key={g.id} className="mb-5">
            <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-on-forest/55 dark:text-ink-muted">
              {t(`nav.group.${g.id}`)}
            </p>
            <div className="space-y-0.5">
              {g.items.map((item) => (
                <SideNavItem key={item.to} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-on-forest/10 px-3 py-3 dark:border-line">
        <SideNavItem item={SETTINGS_ITEM} />
      </div>
    </aside>
  );
}

function UserMenu() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuthActions();
  const setTourDone = usePrefs((s) => s.setTourDone);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  if (!user) return null;
  const role = user.roles.includes('admin') ? 'admin' : user.roles[0];
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('nav.account', { name: user.name })}
        className="grid h-12 w-12 place-items-center rounded-full bg-clay font-semibold text-white dark:text-forest-deep"
      >
        {initials(user.name)}
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-line bg-surface shadow-pop">
          <div className="border-b border-line px-4 py-3">
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-ink-muted">{t(`roles.${role}`)}</p>
          </div>
          <button role="menuitem" type="button" className="flex min-h-touch w-full items-center gap-3 px-4 hover:bg-surface-2" onClick={() => { setOpen(false); navigate('/app/settings'); }}>
            <Settings className="h-5 w-5 text-ink-muted" aria-hidden="true" /> {t('nav.settings')}
          </button>
          <button role="menuitem" type="button" className="flex min-h-touch w-full items-center gap-3 px-4 hover:bg-surface-2" onClick={() => { setOpen(false); setTourDone(false); navigate('/app'); }}>
            <HelpCircle className="h-5 w-5 text-ink-muted" aria-hidden="true" /> {t('tour.restart')}
          </button>
          <button role="menuitem" type="button" className="flex min-h-touch w-full items-center gap-3 px-4 text-danger hover:bg-surface-2" onClick={async () => { setOpen(false); await logout(); navigate('/login'); }}>
            <LogOut className="h-5 w-5" aria-hidden="true" /> {t('auth.logout')}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function RunDemoButton() {
  const { t } = useTranslation();
  const running = useDemo((s) => s.running);
  const start = useDemo((s) => s.start);
  const stop = useDemo((s) => s.stop);
  if (!config.flags.demoMode) return null;
  return (
    <button
      type="button"
      data-tour="run-demo"
      onClick={running ? stop : start}
      className={cx(
        'flex min-h-touch min-w-touch items-center justify-center gap-2 rounded-md px-2.5 text-sm font-semibold transition-colors sm:px-3',
        running ? 'bg-danger text-white dark:text-forest-deep' : 'bg-clay text-white hover:bg-clay/90 dark:text-forest-deep',
      )}
    >
      {running ? <Square className="h-5 w-5" aria-hidden="true" /> : <PlayCircle className="h-5 w-5" aria-hidden="true" />}
      <span className="hidden sm:inline">{running ? t('demo.stop') : t('demo.runFull')}</span>
      <span className="sr-only sm:hidden">{running ? t('demo.stopShort') : t('demo.runShort')}</span>
    </button>
  );
}

function TopBar() {
  const { t } = useTranslation();
  return (
    <header className="no-print sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-content items-center gap-1.5 px-3 sm:gap-2 sm:px-6 lg:px-8">
        <NavLink to="/app" className="lg:hidden" aria-label={t('nav.dashboard')}>
          <LogoMark className="sm:hidden" />
          <Logo className="hidden sm:inline-flex" />
        </NavLink>
        <div className="flex-1" />
        <RunDemoButton />
        <LanguageSwitcher compact className="sm:hidden" />
        <LanguageSwitcher className="hidden sm:block" />
        <ThemeToggle className="hidden sm:grid" />
        <UserMenu />
      </div>
    </header>
  );
}

function BottomNav({ onMore }) {
  const { t } = useTranslation();
  const isFarmer = useIsFarmer();
  const items = isFarmer ? FARMER_NAV.slice(0, 4) : BOTTOM_ITEMS;
  return (
    <nav aria-label={t('nav.main')} className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur safe-bottom lg:hidden">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                data-tour={item.tour}
                className={({ isActive }) =>
                  cx('flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-[0.72rem] font-semibold', isActive ? 'text-forest' : 'text-ink-muted')
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cx('grid h-8 w-12 place-items-center rounded-full', isActive && 'bg-forest/10')}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="max-w-full truncate px-1">{t(item.labelKey)}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
        <li>
          <button type="button" onClick={onMore} className="flex min-h-[60px] w-full flex-col items-center justify-center gap-0.5 text-[0.72rem] font-semibold text-ink-muted">
            <span className="grid h-8 w-12 place-items-center rounded-full">
              <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            </span>
            {t('nav.more')}
          </button>
        </li>
      </ul>
    </nav>
  );
}

function MoreSheet({ open, onClose }) {
  const { t } = useTranslation();
  const groups = useVisibleGroups();
  const items = [...groups.flatMap((g) => g.items), SETTINGS_ITEM];
  return (
    <Modal open={open} onClose={onClose} title={t('nav.more')} variant="sheet">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{t('settings.theme')}</span>
        <ThemeToggle />
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  cx('flex min-h-[64px] items-center gap-3 rounded-lg border px-3 font-medium', isActive ? 'border-forest bg-forest/5 text-forest' : 'border-line')
                }
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="leading-tight">{t(item.labelKey)}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

export default function AppShell() {
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="min-h-screen paper-grain">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-md focus:bg-surface focus:px-4 focus:py-3 focus:shadow-pop">
        {t('common.skipToContent')}
      </a>
      <Sidebar />
      <div className="lg:pl-72">
        <DemoBanner />
        <OfflineBanner />
        <TopBar />
        <main id="main" ref={mainRef} tabIndex={-1} className="mx-auto max-w-content px-4 pb-32 pt-6 outline-none sm:px-6 lg:px-8 lg:pb-16">
          <ErrorBoundary resetKey={location.pathname}>
            <Suspense fallback={<SkeletonCards count={3} className="sm:grid-cols-2 lg:grid-cols-3" />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <BottomNav onMore={() => setMoreOpen(true)} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
      <DemoController />
      <TourOverlay />
    </div>
  );
}
