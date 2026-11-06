import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toAppError } from '@/services';
import { useAuthActions } from '@/hooks/useAuth';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { Button } from '@/components/ui';
import AuthLayout from '@/components/features/auth/AuthLayout';
import { cx } from '@/utils/browser';

const LENGTH = 6;

function readChallenge() {
  try {
    return JSON.parse(sessionStorage.getItem('cropwise-otp') ?? 'null');
  } catch {
    return null;
  }
}

export default function Verify() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toMessage = useErrorMessage();
  const { verifyOtp, requestOtp } = useAuthActions();
  const [challenge, setChallenge] = useState(readChallenge);
  const [digits, setDigits] = useState(Array(LENGTH).fill(''));
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(challenge?.resendInSec ?? 30);
  const refs = useRef([]);
  const returnTo = params.get('returnTo') || '/app';

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);
  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  if (!challenge) return <Navigate to="/login" replace />;

  const code = digits.join('');
  const verify = async (value = code) => {
    if (value.length !== LENGTH) return;
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(challenge.challengeId, value);
      sessionStorage.removeItem('cropwise-otp');
      navigate(returnTo, { replace: true });
    } catch (e) {
      setError(toAppError(e));
      setDigits(Array(LENGTH).fill(''));
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const setDigit = (i, v) => {
    const clean = v.replace(/\D/g, '');
    if (clean.length > 1) {
      const next = clean.slice(0, LENGTH).split('');
      const filled = [...next, ...Array(LENGTH - next.length).fill('')];
      setDigits(filled);
      refs.current[Math.min(next.length, LENGTH - 1)]?.focus();
      if (next.length === LENGTH) verify(next.join(''));
      return;
    }
    const nextDigits = digits.map((d, idx) => (idx === i ? clean : d));
    setDigits(nextDigits);
    if (clean && i < LENGTH - 1) refs.current[i + 1]?.focus();
    if (nextDigits.every(Boolean)) verify(nextDigits.join(''));
  };

  const resend = async () => {
    try {
      const fresh = await requestOtp(sessionStorage.getItem('cropwise-otp-phone') ?? '');
      sessionStorage.setItem('cropwise-otp', JSON.stringify(fresh));
      setChallenge(fresh);
      setResendIn(fresh.resendInSec);
    } catch (e) {
      setError(toAppError(e));
    }
  };

  return (
    <AuthLayout title={t('auth.verifyTitle')} subtitle={t('auth.verifySubtitle', { phone: challenge.phoneMasked })}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          verify();
        }}
        className="space-y-5"
      >
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{t('auth.enterCode')}</legend>
          <div className="flex gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
                }}
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                maxLength={LENGTH}
                aria-label={t('auth.digit', { n: i + 1 })}
                className={cx(
                  'h-14 w-full min-w-0 rounded-md border-2 bg-surface text-center font-display text-2xl font-semibold tabular focus:border-forest focus:outline-none',
                  error ? 'border-danger' : 'border-line',
                )}
              />
            ))}
          </div>
        </fieldset>
        {error ? <p className="text-sm font-medium text-danger" role="alert">{toMessage(error)?.title} – {toMessage(error)?.description}</p> : null}
        {challenge.demoCode ? (
          <p className="flex items-center gap-2 rounded-lg border border-ochre/50 bg-ochre/10 p-3 text-sm">
            <KeyRound className="h-4 w-4 shrink-0 text-clay" aria-hidden="true" />
            {t('auth.demoCode', { code: challenge.demoCode })}
          </p>
        ) : null}
        <Button type="submit" size="lg" fullWidth icon={ShieldCheck} loading={loading} disabled={code.length !== LENGTH}>
          {t('auth.verify')}
        </Button>
        <div className="flex items-center justify-between text-sm">
          <Link to="/login" className="font-semibold text-forest underline-offset-4 hover:underline">{t('auth.changeNumber')}</Link>
          {resendIn > 0 ? (
            <span className="text-ink-muted tabular" aria-live="polite">{t('auth.resendIn', { s: resendIn })}</span>
          ) : (
            <Button variant="link" size="sm" onClick={resend}>{t('auth.resend')}</Button>
          )}
        </div>
      </form>
    </AuthLayout>
  );
}
