import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Database, Download, FlaskConical, HelpCircle, Languages, LogOut, Monitor, Moon, Palette, RefreshCw, Ruler, Sun, Timer, Type, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { LANGUAGE_OPTIONS } from '@/i18n';
import { toAppError, useServices } from '@/services';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useAuthActions } from '@/hooks/useAuth';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { usePrefs, TEXT_SIZES } from '@/store/prefsStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { Button, Card, CardHeader, ErrorState, Field, PageHeader, SegmentedControl, Select, SkeletonCards, Switch, TextInput } from '@/components/ui';
import { downloadText } from '@/utils/browser';

function ProfileCard() {
  const { t } = useTranslation();
  const services = useServices();
  const toMessage = useErrorMessage();
  const setUser = useAuthStore((s) => s.setUser);
  const profile = useServiceQuery((s) => s.profile.getProfile(), []);
  const regions = useServiceQuery((s) => s.farms.listRegions(), []);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profile.data) {
      const u = profile.data.user;
      setForm({ name: u.name, village: u.village ?? '', state: u.state ?? 'Karnataka', district: u.district ?? '' });
    }
  }, [profile.data]);

  if (profile.loading || !form) return <SkeletonCards count={1} cardClassName="h-72" />;
  if (profile.error) return <ErrorState error={profile.error} onRetry={profile.reload} />;
  const districts = regions.data?.find((r) => r.state === form.state)?.districts ?? [];
  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const p = await services.profile.updateProfile({ name: form.name, village: form.village || null, state: form.state, district: form.district || null });
      setUser(p.user);
      toast.success(t('settings.profileSaved'));
    } catch (e) {
      setError(toAppError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader icon={User} title={t('settings.profile')} subtitle={profile.data.user.phone} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('settings.name')} error={error?.fieldErrors?.name ? t('wizard.required') : undefined} className="sm:col-span-2">
          <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
        </Field>
        <Field label={t('farms.state')}>
          <Select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value, district: '' })}>
            {(regions.data ?? []).map((r) => <option key={r.state} value={r.state}>{r.state}</option>)}
          </Select>
        </Field>
        <Field label={t('farms.district')}>
          <Select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
            <option value="">{t('farms.chooseDistrict')}</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </Field>
        <Field label={t('farms.village')} className="sm:col-span-2">
          <TextInput value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} />
        </Field>
      </div>
      {error && !error.fieldErrors ? <p className="mt-3 text-sm text-danger" role="alert">{toMessage(error)?.title}</p> : null}
      <div className="mt-4 flex justify-end">
        <Button onClick={save} loading={saving}>{t('common.save')}</Button>
      </div>
    </Card>
  );
}

function NotificationsCard() {
  const { t } = useTranslation();
  const services = useServices();
  const profile = useServiceQuery((s) => s.profile.getProfile(), []);
  const prefs = profile.data?.notifications;
  const update = async (patch) => {
    const next = { ...prefs, ...patch };
    profile.setData((p) => ({ ...p, notifications: next }));
    try {
      await services.profile.updateNotifications(next);
    } catch {
      profile.reload();
    }
  };
  return (
    <Card>
      <CardHeader icon={Bell} title={t('settings.notifications')} subtitle={t('settings.notificationsNote')} />
      {!prefs ? (
        <SkeletonCards count={1} cardClassName="h-40" />
      ) : (
        <div className="divide-y divide-line">
          <Switch checked={prefs.sprayReminders} onChange={(v) => update({ sprayReminders: v })} label={t('settings.notif.spray')} description={t('settings.notif.sprayHint')} />
          <Switch checked={prefs.phiAlerts} onChange={(v) => update({ phiAlerts: v })} label={t('settings.notif.phi')} description={t('settings.notif.phiHint')} />
          <Switch checked={prefs.weatherAlerts} onChange={(v) => update({ weatherAlerts: v })} label={t('settings.notif.weather')} />
          <Switch checked={prefs.learningTips} onChange={(v) => update({ learningTips: v })} label={t('settings.notif.tips')} />
          <div className="pt-3">
            <p className="mb-1.5 text-sm font-semibold">{t('settings.channel')}</p>
            <SegmentedControl label={t('settings.channel')} value={prefs.channel} onChange={(v) => update({ channel: v })} options={['sms', 'whatsapp', 'push'].map((c) => ({ value: c, label: t(`settings.channels.${c}`) }))} />
          </div>
        </div>
      )}
    </Card>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const services = useServices();
  const toMessage = useErrorMessage();
  const { logout } = useAuthActions();
  const { lang, setLang, theme, setTheme, textSize, stepTextSize, areaUnit, setAreaUnit, setTourDone } = usePrefs();
  const [exporting, setExporting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const changeLang = (code) => {
    setLang(code);
    services.profile.updateProfile({ preferredLang: code }).catch(() => undefined);
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const file = await services.profile.requestDataExport();
      downloadText(file.fileName, file.mimeType, file.content);
      toast.success(t('settings.exported'), file.fileName);
    } catch (e) {
      toast.error(toMessage(toAppError(e))?.title ?? '');
    } finally {
      setExporting(false);
    }
  };

  const resetDemo = async () => {
    setResetting(true);
    await services.demo.resetDemoData();
    setResetting(false);
    toast.success(t('settings.demoReset'));
    navigate('/app');
  };

  const sizeIndex = TEXT_SIZES.indexOf(textSize);

  return (
    <div>
      <PageHeader eyebrow={t('settings.eyebrow')} title={t('settings.title')} subtitle={t('settings.subtitle')} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader icon={Palette} title={t('settings.display')} />
            <div className="space-y-5">
              <div>
                <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold"><Languages className="h-4 w-4" aria-hidden="true" />{t('settings.language')}</p>
                <Select value={lang} onChange={(e) => changeLang(e.target.value)} aria-label={t('settings.language')}>
                  {LANGUAGE_OPTIONS.map((l) => <option key={l.code} value={l.code}>{l.label} · {l.english}</option>)}
                </Select>
              </div>
              <div>
                <p className="mb-1.5 text-sm font-semibold">{t('settings.theme')}</p>
                <SegmentedControl
                  label={t('settings.theme')}
                  value={theme}
                  onChange={setTheme}
                  options={[
                    { value: 'light', label: t('settings.themeLight'), icon: Sun },
                    { value: 'dark', label: t('settings.themeDark'), icon: Moon },
                    { value: 'system', label: t('settings.themeSystem'), icon: Monitor },
                  ]}
                />
              </div>
              <div>
                <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold"><Type className="h-4 w-4" aria-hidden="true" />{t('settings.textSize')}</p>
                <div className="flex items-center gap-3">
                  <Button variant="secondary" onClick={() => stepTextSize(-1)} disabled={sizeIndex === 0} aria-label={t('settings.smaller')}>A−</Button>
                  <div className="flex flex-1 gap-1" aria-hidden="true">
                    {TEXT_SIZES.map((s, i) => <span key={s} className={`h-2 flex-1 rounded-full ${i <= sizeIndex ? 'bg-forest' : 'bg-surface-2'}`} />)}
                  </div>
                  <Button variant="secondary" onClick={() => stepTextSize(1)} disabled={sizeIndex === TEXT_SIZES.length - 1} aria-label={t('settings.larger')}>A+</Button>
                </div>
                <p className="mt-1 text-sm text-ink-muted" aria-live="polite">{t(`settings.size.${textSize}`)}</p>
              </div>
              <div>
                <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold"><Ruler className="h-4 w-4" aria-hidden="true" />{t('settings.units')}</p>
                <SegmentedControl label={t('settings.units')} value={areaUnit} onChange={setAreaUnit} options={[{ value: 'acre', label: t('units.acre_other') }, { value: 'hectare', label: t('units.hectare_other') }]} />
                <p className="mt-1 text-sm text-ink-muted">{t('settings.unitsHint')}</p>
              </div>
            </div>
          </Card>
          <NotificationsCard />
        </div>
        <div className="space-y-6">
          <ProfileCard />
          <Card>
            <CardHeader icon={Database} title={t('settings.data')} subtitle={t('settings.dataHint')} />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" icon={Download} onClick={exportData} loading={exporting}>{t('settings.export')}</Button>
              <Button variant="secondary" icon={HelpCircle} onClick={() => { setTourDone(false); navigate('/app'); }}>{t('tour.restart')}</Button>
            </div>
          </Card>
          {config.flags.demoMode ? (
            <Card tone="warn">
              <CardHeader icon={FlaskConical} iconClassName="bg-ochre/20 text-clay" title={t('settings.demoTools')} subtitle={t('settings.demoToolsHint')} />
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" icon={RefreshCw} onClick={resetDemo} loading={resetting}>{t('settings.resetDemo')}</Button>
                <Button variant="secondary" icon={Timer} onClick={() => { services.demo.simulateSessionExpiry(); toast.info(t('settings.expiryArmed')); }}>{t('settings.simulateExpiry')}</Button>
              </div>
            </Card>
          ) : null}
          <Button variant="danger" icon={LogOut} fullWidth size="lg" onClick={async () => { await logout(); navigate('/login'); }}>
            {t('auth.logout')}
          </Button>
        </div>
      </div>
    </div>
  );
}
