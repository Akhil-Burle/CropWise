import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { hasRole, useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { Button, EmptyState, Spinner } from '@/components/ui';
import { LogoMark } from '../brand/Logo';

export function FullScreenLoader() {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-screen place-items-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <LogoMark className="h-14 w-14" />
        <Spinner label={t('common.loading')} />
      </div>
    </div>
  );
}

/** Redirects to login (with return URL) when there is no session or it expired. */
export function RequireAuth() {
  const { t } = useTranslation();
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  useEffect(() => {
    if (status === 'expired') toast.warning(t('auth.sessionExpired'), t('auth.sessionExpiredText'));
  }, [status, t]);

  if (status === 'unknown') return <FullScreenLoader />;
  if (status !== 'authenticated') {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}${status === 'expired' ? '&expired=1' : ''}`} replace />;
  }
  return <Outlet />;
}

/** Role-based gate driven by roles returned from the AuthService. */
export function RequireRole({ roles }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  if (!hasRole(user, roles)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title={t('errors.FORBIDDEN.title')}
        description={t('errors.FORBIDDEN.description')}
        action={<Button to="/app">{t('nav.dashboard')}</Button>}
      />
    );
  }
  return <Outlet />;
}

/** Sends signed-in users away from login/register. */
export function PublicOnly() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();
  if (status === 'unknown') return <FullScreenLoader />;
  if (status === 'authenticated') {
    const params = new URLSearchParams(location.search);
    return <Navigate to={params.get('returnTo') || '/app'} replace />;
  }
  return <Outlet />;
}
