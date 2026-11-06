import { useCallback, useEffect, useState } from 'react';
import { platform } from '@/platform';
import type { Lang } from '@/types';

/** Read-aloud through the platform layer: browser speech on web, Android TTS in the app. */
export function useSpeech(lang: Lang) {
  const supported = platform.speech.supported();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => void platform.speech.stop(), []);

  const speak = useCallback(
    async (text: string) => {
      if (!supported || !text.trim()) return;
      setSpeaking(true);
      try {
        await platform.speech.speak(text, lang);
      } finally {
        setSpeaking(false);
      }
    },
    [lang, supported],
  );

  const stop = useCallback(() => {
    void platform.speech.stop();
    setSpeaking(false);
  }, []);

  return { supported, speaking, speak, stop };
}
