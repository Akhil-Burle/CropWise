import { usePrefs } from '@/store/prefsStore';
import type { Lang } from '@/types';

/** Active UI language – passed to every content-returning service call. */
export const useLang = (): Lang => usePrefs((s) => s.lang);
