import { useAuthStore } from '@/store/authStore';
import { usePrefs } from '@/store/prefsStore';

/**
 * Farmers see a simple view (few big buttons, plain sentences, no charts).
 * Agronomists and admins see the full expert view. Either can switch in Settings.
 */
export function useSimpleMode(): boolean {
  const pref = usePrefs((s) => s.simpleMode);
  const user = useAuthStore((s) => s.user);
  if (pref !== null) return pref;
  return !user?.roles.some((r) => r === 'agronomist' || r === 'admin');
}
