import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sprout, Stethoscope, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toAppError } from '@/services';
import { LANGUAGE_OPTIONS } from '@/i18n';
import { useAuthActions } from '@/hooks/useAuth';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { usePrefs } from '@/store/prefsStore';
import { Button, Field, SegmentedControl, Select, TextInput } from '@/components/ui';
import AuthLayout from '@/components/features/auth/AuthLayout';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toMessage = useErrorMessage();
  const lang = usePrefs((s) => s.lang);
  const setLang = usePrefs((s) => s.setLang);
  const { register } = useAuthActions();
  const regions = useServiceQuery((s) => s.farms.listRegions(), []);
  const [form, setForm] = useState({ name: '', phone: '', role: 'farmer', state: 'Karnataka', district: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (p) => setForm((f) => ({ ...f, ...p }));
  const fe = error?.fieldErrors ?? {};
  const districts = regions.data?.find((r) => r.state === form.state)?.districts ?? [];

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const challenge = await register({ ...form, lang });
      sessionStorage.setItem('cropwise-otp', JSON.stringify(challenge));
      sessionStorage.setItem('cropwise-otp-phone', form.phone);
      navigate(`/verify?returnTo=${encodeURIComponent(params.get('returnTo') || '/app')}`);
    } catch (err) {
      setError(toAppError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <p className="mb-1.5 text-sm font-semibold">{t('auth.iAm')}</p>
          <SegmentedControl
            label={t('auth.iAm')}
            size="lg"
            value={form.role}
            onChange={(v) => set({ role: v })}
            options={[
              { value: 'farmer', label: t('roles.farmer'), icon: Sprout, hint: t('auth.farmerHint') },
              { value: 'agronomist', label: t('roles.agronomist'), icon: Stethoscope, hint: t('auth.agronomistHint') },
            ]}
          />
        </div>
        <Field label={t('settings.name')} error={fe.name ? t('wizard.required') : undefined} required>
          <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} autoComplete="name" />
        </Field>
        <Field label={t('auth.phone')} error={fe.phone ? (fe.phone === 'exists' ? t('auth.phoneExists') : t('auth.phoneInvalid')) : undefined} required>
          <TextInput type="tel" inputMode="numeric" maxLength={10} value={form.phone} onChange={(e) => set({ phone: e.target.value.replace(/\D/g, '') })} autoComplete="tel-national" placeholder="98450 12345" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('farms.state')}>
            <Select value={form.state} onChange={(e) => set({ state: e.target.value, district: '' })}>
              {(regions.data ?? []).map((r) => <option key={r.state} value={r.state}>{r.state}</option>)}
            </Select>
          </Field>
          <Field label={t('farms.district')} error={fe.district ? t('wizard.required') : undefined} required>
            <Select value={form.district} onChange={(e) => set({ district: e.target.value })}>
              <option value="">{t('farms.chooseDistrict')}</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </Field>
        </div>
        <Field label={t('settings.language')}>
          <Select value={lang} onChange={(e) => setLang(e.target.value)}>
            {LANGUAGE_OPTIONS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </Select>
        </Field>
        {error && !error.fieldErrors ? <p className="text-sm font-medium text-danger" role="alert">{toMessage(error)?.title}</p> : null}
        <Button type="submit" size="lg" fullWidth icon={UserPlus} loading={loading}>{t('auth.createAccount')}</Button>
      </form>
      <p className="mt-6 text-center text-sm">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="font-semibold text-forest underline-offset-4 hover:underline">{t('auth.login')}</Link>
      </p>
    </AuthLayout>
  );
}
