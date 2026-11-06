import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, BarChart3, Phone, Sprout, Stethoscope } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toAppError } from '@/services';
import { useAuthActions } from '@/hooks/useAuth';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useLang } from '@/hooks/useLang';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { Button, Field, TextInput } from '@/components/ui';
import AuthLayout from '@/components/features/auth/AuthLayout';

const ROLE_ICON = { farmer: Sprout, agronomist: Stethoscope, admin: BarChart3 };

export default function Login() {
  const { t } = useTranslation();
  const lang = useLang();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toMessage = useErrorMessage();
  const { requestOtp, loginAsDemo } = useAuthActions();
  const demo = useServiceQuery((s) => s.auth.getDemoAccounts(lang), [lang]);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(null);
  const returnTo = params.get('returnTo') || '/app';
  const expired = params.get('expired') === '1';

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading('otp');
    try {
      const challenge = await requestOtp(phone);
      sessionStorage.setItem('cropwise-otp', JSON.stringify(challenge));
      sessionStorage.setItem('cropwise-otp-phone', phone);
      navigate(`/verify?returnTo=${encodeURIComponent(returnTo)}`);
    } catch (err) {
      setError(toAppError(err));
    } finally {
      setLoading(null);
    }
  };

  const demoLogin = async (id) => {
    setLoading(id);
    setError(null);
    try {
      await loginAsDemo(id);
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(toAppError(err));
      setLoading(null);
    }
  };

  const phoneError = error?.fieldErrors?.phone ? t('auth.phoneInvalid') : null;

  return (
    <AuthLayout title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      {expired ? (
        <div className="mb-5 flex gap-3 rounded-lg border border-warn/50 bg-warn/10 p-3 text-sm" role="alert">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warn" aria-hidden="true" />
          <p><strong>{t('auth.sessionExpired')}</strong> {t('auth.sessionExpiredText')}</p>
        </div>
      ) : null}
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label={t('auth.phone')} hint={t('auth.phoneHint')} error={phoneError}>
          <div className="flex">
            <span className="flex items-center rounded-l-md border border-r-0 border-line bg-surface-2 px-3 font-semibold text-ink-muted">+91</span>
            <TextInput
              id="login-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="98450 12345"
              className="rounded-l-none"
              aria-invalid={phoneError ? true : undefined}
            />
          </div>
        </Field>
        {error && !error.fieldErrors ? <p className="text-sm font-medium text-danger" role="alert">{toMessage(error)?.title}</p> : null}
        <Button type="submit" fullWidth size="lg" icon={Phone} loading={loading === 'otp'} disabled={phone.length < 10}>
          {t('auth.sendOtp')}
        </Button>
      </form>

      {demo.data?.length ? (
        <section className="mt-8" aria-labelledby="demo-heading">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <h2 id="demo-heading" className="font-sans text-sm font-semibold text-ink-muted">{t('auth.demoTitle')}</h2>
            <span className="h-px flex-1 bg-line" />
          </div>
          <ul className="space-y-2">
            {demo.data.map((a) => {
              const Icon = ROLE_ICON[a.role];
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => demoLogin(a.id)}
                    disabled={Boolean(loading)}
                    className="flex min-h-[64px] w-full items-center gap-3 rounded-lg border border-line bg-surface p-3 text-left hover:border-forest disabled:opacity-60"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-forest/10 text-forest" aria-hidden="true"><Icon className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{t('auth.continueAs', { name: a.name })} · {t(`roles.${a.role}`)}</span>
                      <span className="block text-sm text-ink-muted">{a.description}</span>
                    </span>
                    <ArrowRight className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <p className="mt-8 text-center text-sm">
        {t('auth.noAccount')}{' '}
        <Link to={`/register?returnTo=${encodeURIComponent(returnTo)}`} className="font-semibold text-forest underline-offset-4 hover:underline">
          {t('auth.register')}
        </Link>
      </p>
    </AuthLayout>
  );
}
