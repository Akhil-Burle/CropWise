import { useCallback, useEffect } from 'react';
import { sessionEvents, useServices } from '@/services';
import { useAuthStore } from '@/store/authStore';
import { usePrefs } from '@/store/prefsStore';
import type { RegisterInput, Session } from '@/types';

/** Resolves the current session once and listens for UNAUTHORIZED from any service. */
export function useAuthBootstrap(): void {
  const services = useServices();
  const setUser = useAuthStore((s) => s.setUser);
  const expire = useAuthStore((s) => s.expire);

  useEffect(() => {
    let alive = true;
    services.auth
      .getCurrentUser()
      .then((u) => alive && setUser(u))
      .catch(() => alive && setUser(null));
    const off = sessionEvents.onUnauthorized(() => expire());
    return () => {
      alive = false;
      off();
    };
  }, [services, setUser, expire]);
}

export function useAuthActions() {
  const services = useServices();
  const setUser = useAuthStore((s) => s.setUser);
  const setLang = usePrefs((s) => s.setLang);

  const onSession = useCallback(
    (session: Session) => {
      setUser(session.user);
      if (session.user.preferredLang) setLang(session.user.preferredLang);
      return session;
    },
    [setUser, setLang],
  );

  return {
    requestOtp: (phone: string) => services.auth.requestOtp(phone),
    register: (input: RegisterInput) => services.auth.register(input),
    verifyOtp: async (challengeId: string, code: string) => onSession(await services.auth.verifyOtp(challengeId, code)),
    loginAsDemo: async (accountId: string) => onSession(await services.auth.loginAsDemo(accountId)),
    logout: async () => {
      await services.auth.logout().catch(() => undefined);
      setUser(null);
    },
  };
}
