import { Square, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { useLang } from '@/hooks/useLang';
import { useSpeech } from '@/hooks/useSpeech';
import { Button } from '@/components/ui';

/** Optional read-aloud using the browser's SpeechSynthesis. Hidden when unsupported. */
export default function ReadAloudButton({ getText, size = 'md', variant = 'secondary', className }) {
  const { t } = useTranslation();
  const lang = useLang();
  const { supported, speaking, speak, stop } = useSpeech(lang);
  if (!supported || !config.flags.readAloud) return null;
  return (
    <Button
      variant={variant}
      size={size}
      icon={speaking ? Square : Volume2}
      onClick={() => (speaking ? stop() : speak(getText()))}
      aria-pressed={speaking}
      className={className}
    >
      {speaking ? t('common.stopReading') : t('common.readAloud')}
    </Button>
  );
}
