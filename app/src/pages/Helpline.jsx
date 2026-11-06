import { useEffect, useRef, useState } from 'react';
import { Bot, Phone, Send, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toAppError, useServices } from '@/services';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useLang } from '@/hooks/useLang';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { Badge, Button, Card, CardHeader, ErrorState, PageHeader, SkeletonCards, TextInput } from '@/components/ui';
import { formatDateTime } from '@/utils/format';
import { cx } from '@/utils/browser';

export default function Helpline() {
  const { t } = useTranslation();
  const lang = useLang();
  const services = useServices();
  const toMessage = useErrorMessage();
  const thread = useServiceQuery((s) => s.chat.getThread(lang), [lang]);
  const helplines = useServiceQuery((s) => s.chat.getHelplines(lang), [lang]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);
  const messages = thread.data ?? [];
  const last = messages[messages.length - 1];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length, sending]);

  const send = async (value) => {
    const msg = value.trim();
    if (!msg || sending) return;
    setText('');
    setError(null);
    setSending(true);
    thread.setData((prev) => [...(prev ?? []), { id: `local-${Date.now()}`, role: 'user', text: msg, createdAt: new Date().toISOString(), suggestions: [] }]);
    try {
      const reply = await services.chat.send(msg, lang);
      thread.setData((prev) => [...(prev ?? []), reply]);
    } catch (e) {
      setError(toAppError(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow={t('help.eyebrow')} title={t('help.title')} subtitle={t('help.subtitle')} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card padded={false} className="flex h-[70vh] min-h-[480px] flex-col overflow-hidden lg:col-span-2">
          <div className="flex items-center gap-3 border-b border-line px-5 py-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-forest text-on-forest" aria-hidden="true"><Bot className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t('help.assistant')}</p>
              <p className="text-xs text-ink-muted">{t('help.assistantNote')}</p>
            </div>
            <Badge tone="ochre" size="sm">{t('demo.badge')}</Badge>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-5" role="log" aria-live="polite" aria-label={t('help.conversation')}>
            {thread.loading ? <SkeletonCards count={2} cardClassName="h-16" /> : null}
            {thread.error ? <ErrorState error={thread.error} onRetry={thread.reload} compact /> : null}
            {messages.map((m) => (
              <div key={m.id} className={cx('flex gap-2', m.role === 'user' ? 'flex-row-reverse' : '')}>
                <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-full', m.role === 'user' ? 'bg-clay text-white dark:text-forest-deep' : 'bg-surface-2 text-forest')} aria-hidden="true">
                  {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </span>
                <div className={cx('max-w-[85%] rounded-xl px-4 py-2.5', m.role === 'user' ? 'rounded-tr-sm bg-forest text-on-forest' : 'rounded-tl-sm bg-surface-2')}>
                  <span className="sr-only">{m.role === 'user' ? t('help.you') : t('help.assistant')}: </span>
                  <p className="whitespace-pre-line">{m.text}</p>
                  <p className={cx('mt-1 text-[11px]', m.role === 'user' ? 'text-on-forest/70' : 'text-ink-muted')}>{formatDateTime(m.createdAt, lang)}</p>
                </div>
              </div>
            ))}
            {sending ? (
              <div className="flex items-center gap-2 text-sm text-ink-muted" role="status">
                <Bot className="h-4 w-4" aria-hidden="true" />
                <span className="flex gap-1" aria-hidden="true">
                  {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-ink-muted" style={{ animationDelay: `${i * 120}ms` }} />)}
                </span>
                <span className="sr-only">{t('help.typing')}</span>
              </div>
            ) : null}
            {error ? <p className="text-sm text-danger" role="alert">{toMessage(error)?.title}</p> : null}
            <div ref={endRef} />
          </div>
          {last?.role === 'assistant' && last.suggestions.length && !sending ? (
            <div className="flex gap-2 overflow-x-auto border-t border-line px-5 py-2 scrollbar-thin">
              {last.suggestions.map((s) => (
                <button key={s} type="button" onClick={() => send(s)} className="min-h-[40px] shrink-0 rounded-full border border-forest/40 px-3 text-sm font-medium text-forest hover:bg-forest/5">
                  {s}
                </button>
              ))}
            </div>
          ) : null}
          <form
            className="flex gap-2 border-t border-line p-3 safe-bottom"
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
          >
            <label htmlFor="chat-input" className="sr-only">{t('help.placeholder')}</label>
            <TextInput id="chat-input" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('help.placeholder')} autoComplete="off" />
            <Button type="submit" icon={Send} disabled={!text.trim() || sending}>{t('help.send')}</Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader icon={Phone} title={t('help.helplines')} subtitle={t('help.helplinesNote')} />
            {helplines.loading ? <SkeletonCards count={3} cardClassName="h-24" /> : helplines.error ? <ErrorState error={helplines.error} onRetry={helplines.reload} compact /> : (
              <ul className="space-y-3">
                {helplines.data.map((h) => (
                  <li key={h.id} className="rounded-lg border border-line p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">{h.name}</p>
                      {h.isDemo ? <Badge tone="ochre" size="sm">{t('help.placeholderNumber')}</Badge> : null}
                    </div>
                    <p className="font-display text-2xl font-semibold tabular">{h.number}</p>
                    <p className="text-sm text-ink-muted">{h.hours}</p>
                    <p className="mt-1 text-sm">{h.description}</p>
                    {!h.isDemo ? (
                      <Button variant="secondary" size="sm" icon={Phone} href={`tel:${h.number.replace(/[^\d+]/g, '')}`} className="mt-3">
                        {t('help.call')}
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card tone="inset">
            <p className="text-sm text-ink-muted">{t('help.disclaimer')}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
