import { create } from 'zustand';
import type { Role, User } from '@/types';

export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous' | 'expired';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  setUser: (user: User | null) => void;
  expire: () => void;
}

/**
 * Token-agnostic: the store only knows who the user is. Whether the session lives in a cookie
 * or a bearer token is decided inside the AuthService adapter.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  status: 'unknown',
  user: null,
  setUser: (user) => set({ user, status: user ? 'authenticated' : 'anonymous' }),
  expire: () => set((s) => (s.status === 'authenticated' ? { user: null, status: 'expired' } : s)),
}));

export const hasRole = (user: User | null, roles: Role[]): boolean =>
  Boolean(user && user.roles.some((r) => roles.includes(r)));

/** Farmers get the simple app; agronomists and admins get the expert app. */
export const useIsFarmer = (): boolean =>
  useAuthStore((s) => Boolean(s.user) && !hasRole(s.user, ['agronomist', 'admin']));
