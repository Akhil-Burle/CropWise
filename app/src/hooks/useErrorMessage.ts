import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppError } from '@/types';

/** Maps an AppError code to a friendly, translated title + description. */
export function useErrorMessage() {
  const { t, i18n } = useTranslation();
  return useCallback(
    (error: AppError | null | undefined) => {
      if (!error) return null;
      const key = `errors.${error.code}`;
      const known = i18n.exists(`${key}.title`);
      return {
        title: t(known ? `${key}.title` : 'errors.UNKNOWN.title'),
        description: t(known ? `${key}.description` : 'errors.UNKNOWN.description'),
      };
    },
    [t, i18n],
  );
}
