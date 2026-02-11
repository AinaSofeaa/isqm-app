import React, { useEffect, useId, useMemo, useState } from 'react';
import { Briefcase, Check, Mail, Phone, Save, User as UserIcon, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import InstitutionPicker from '../components/InstitutionPicker';
import { getFieldState } from '../lib/fieldState';
import { supabase } from '../services/supabaseClient';
import { useI18n } from '../src/i18n/I18nContext';

type ProfileForm = {
  full_name: string;
  phone: string;
  user_type: 'student' | 'worker' | '';
  institution_id: string;
  company_name: string;
};

const emptyForm: ProfileForm = {
  full_name: '',
  phone: '',
  user_type: '',
  institution_id: '',
  company_name: '',
};

const ProfileView: React.FC = () => {
  const { t } = useI18n();
  const { user, profile, profileLoading, updateProfile } = useAuth();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'info'; key: string } | null>(null);
  const [institutionDisplay, setInstitutionDisplay] = useState<string | null>(null);
  const initialTouched = {
    full_name: false,
    phone: false,
    user_type: false,
    institution_id: false,
    company_name: false,
  };
  const [touched, setTouched] = useState(initialTouched);
  const [submitted, setSubmitted] = useState(false);

  const busy = saving || profileLoading;

  const schemaCacheMessage = (err: any) => {
    const message = (err?.message ?? '').toLowerCase();
    if (message.includes('schema cache')) {
      return 'profile.schemaCacheError';
    }
    return null;
  };

  useEffect(() => {
    setForm({
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      user_type: profile?.user_type ?? '',
      institution_id: profile?.institution_id ?? '',
      company_name: profile?.company_name ?? '',
    });
    setTouched(initialTouched);
    setSubmitted(false);
  }, [profile]);

  useEffect(() => {
    if (form.user_type !== 'student') {
      setInstitutionDisplay(null);
      return;
    }
    if (!form.institution_id) {
      setInstitutionDisplay(profile?.institution ?? null);
      return;
    }
    let active = true;
    const load = async () => {
      const { data, error } = await supabase
        .from('institutions')
        .select('name,state')
        .eq('id', form.institution_id)
        .maybeSingle();
      if (!active) return;
      if (error) {
        console.warn('Failed to load institution display', error);
        setInstitutionDisplay(profile?.institution ?? null);
        return;
      }
      if (data?.name) {
        const label = data.state ? `${data.name} - ${data.state}` : data.name;
        setInstitutionDisplay(label);
      } else {
        setInstitutionDisplay(profile?.institution ?? null);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [form.institution_id, form.user_type, profile?.institution]);

  const messageClasses = useMemo(() => ({
    success: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    error: 'text-red-600 bg-red-50 border-red-100',
    info: 'text-slate-600 bg-slate-50 border-slate-100',
  }), []);

  const markTouched = (field: keyof typeof initialTouched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validatePhone = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (!/^[0-9+()\-\s]{6,}$/.test(trimmed)) return t('profile.phoneInvalid');
    return null;
  };

  const validateInstitution = (value: string) => {
    if (form.user_type !== 'student') return null;
    if (!value.trim()) return t('profile.institutionRequired');
    return null;
  };

  const validateCompany = (value: string) => {
    if (form.user_type !== 'worker') return null;
    if (!value.trim()) return t('profile.companyRequired');
    return null;
  };

  const getFieldClasses = (showError: boolean, showSuccess: boolean) => {
    if (showError) {
      return 'mt-2 flex items-center gap-2 bg-slate-50 border border-red-300 rounded-2xl px-4 py-3 focus-within:border-red-400 focus-within:ring-4 focus-within:ring-red-100';
    }
    if (showSuccess) {
      return 'mt-2 flex items-center gap-2 bg-slate-50 border border-emerald-200 rounded-2xl px-4 py-3 focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-100';
    }
    return 'mt-2 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10';
  };

  const phoneError = validatePhone(form.phone ?? '');
  const institutionError = validateInstitution(form.institution_id ?? '');
  const companyError = validateCompany(form.company_name ?? '');

  const fullNameState = getFieldState({
    value: form.full_name ?? '',
    validator: () => null,
    touched: touched.full_name,
    submitted,
  });
  const userTypeState = getFieldState({
    value: form.user_type ?? '',
    validator: () => null,
    touched: touched.user_type,
    submitted,
  });
  const phoneState = getFieldState({
    value: form.phone ?? '',
    validator: validatePhone,
    touched: touched.phone,
    submitted,
  });
  const institutionState = getFieldState({
    value: form.institution_id ?? '',
    validator: validateInstitution,
    touched: touched.institution_id,
    submitted,
  });
  const companyState = getFieldState({
    value: form.company_name ?? '',
    validator: validateCompany,
    touched: touched.company_name,
    submitted,
  });

  const phoneErrorId = useId();
  const companyErrorId = useId();

  const handleChange = (key: 'full_name' | 'phone' | 'company_name') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleUserTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'student' | 'worker' | '';
    setForm((prev) => ({
      ...prev,
      user_type: value,
      institution_id: value === 'student' ? prev.institution_id : '',
      company_name: value === 'worker' ? prev.company_name : '',
    }));
    if (value === 'student') {
      setTouched((prev) => ({ ...prev, company_name: false }));
    } else if (value === 'worker') {
      setTouched((prev) => ({ ...prev, institution_id: false }));
    } else {
      setTouched((prev) => ({ ...prev, company_name: false, institution_id: false }));
    }
  };

  const handleReset = () => {
    setForm({
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      user_type: profile?.user_type ?? '',
      institution_id: profile?.institution_id ?? '',
      company_name: profile?.company_name ?? '',
    });
    setTouched(initialTouched);
    setSubmitted(false);
    setMsg({ type: 'info', key: 'profile.changesDiscarded' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSubmitted(true);

    if (!user) {
      setMsg({ type: 'error', key: 'profile.needSignInAgain' });
      return;
    }

    const hasErrors = Boolean(phoneError || institutionError || companyError);
    if (hasErrors) return;

    setSaving(true);
    try {
      const trimmedCompany = form.company_name.trim();
      await updateProfile({
        full_name: form.full_name?.trim() || null,
        user_type: form.user_type || null,
        institution_id: form.user_type === 'student' ? form.institution_id || null : null,
        company_name: form.user_type === 'worker' ? trimmedCompany || null : null,
        phone: form.phone?.trim() || null,
      });
      setMsg({ type: 'success', key: 'profile.saveSuccess' });
    } catch (err: any) {
      setMsg({
        type: 'error',
        key: schemaCacheMessage(err) ?? 'profile.saveError',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <section className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        {/* TODO: re-enable profile photo upload + display (Supabase Storage). */}
        <div>
          <h2 className="text-lg font-black text-slate-800">{t('profile.title')}</h2>
          <p className="text-xs text-slate-400">{t('profile.subtitle')}</p>
        </div>
      </section>

      {!profileLoading && user && !profile && (
        <div className="text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
          {t('profile.noProfile')}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <fieldset disabled={busy} className="space-y-4">
          <label className="block">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('profile.emailLabel')}</span>
            <div className="mt-1 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
              <Mail size={18} className="text-slate-400" />
              <input
                value={user?.email ?? ''}
                disabled
                type="email"
                className="w-full bg-transparent outline-none text-sm font-semibold text-slate-500"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('profile.fullNameLabel')}</span>
            <div className={getFieldClasses(fullNameState.showError, fullNameState.showSuccess)}>
              <UserIcon size={18} className="text-slate-400" />
              <input
                value={form.full_name ?? ''}
                onChange={handleChange('full_name')}
                onBlur={() => markTouched('full_name')}
                type="text"
                placeholder={t('profile.fullNamePlaceholder')}
                aria-invalid={fullNameState.showError ? true : undefined}
                className="flex-1 bg-transparent outline-none text-sm font-semibold text-slate-700"
              />
              {fullNameState.showSuccess && (
                <Check size={16} className="text-emerald-500" aria-hidden="true" />
              )}
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('profile.userTypeLabel')}</span>
            <div className={getFieldClasses(userTypeState.showError, userTypeState.showSuccess)}>
              <UserIcon size={18} className="text-slate-400" />
              <select
                value={form.user_type}
                onChange={handleUserTypeChange}
                onBlur={() => markTouched('user_type')}
                aria-invalid={userTypeState.showError ? true : undefined}
                className="flex-1 bg-transparent outline-none text-sm font-semibold text-slate-700"
              >
                <option value="">{t('profile.userTypePlaceholder')}</option>
                <option value="student">{t('auth.userTypeStudent')}</option>
                <option value="worker">{t('auth.userTypeWorker')}</option>
              </select>
              {userTypeState.showSuccess && (
                <Check size={16} className="text-emerald-500" aria-hidden="true" />
              )}
            </div>
          </label>

          {form.user_type === 'student' && (
            <InstitutionPicker
              valueInstitutionId={form.institution_id || null}
              onChange={(inst) => {
                setForm((prev) => ({ ...prev, institution_id: inst?.id ?? '' }));
                setTouched((prev) => ({ ...prev, institution_id: true }));
              }}
              onBlur={() => markTouched('institution_id')}
              errorMessage={institutionError}
              showError={institutionState.showError}
              showSuccess={institutionState.showSuccess}
              requiredHint={t('common.requiredHint')}
              disabled={busy}
            />
          )}

          {form.user_type === 'student' && institutionDisplay && (
            <p className="text-[11px] text-slate-500 ml-1">
              {t('profile.institutionSaved', { name: institutionDisplay })}
            </p>
          )}

          {form.user_type === 'worker' && (
            <label className="block">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('profile.companyLabel')}</span>
              {!companyState.showError && (
                <p className="text-[11px] text-slate-400 mt-1">{t('common.requiredHint')}</p>
              )}
              <div className={getFieldClasses(companyState.showError, companyState.showSuccess)}>
                <Briefcase size={18} className="text-slate-400" />
                <input
                  value={form.company_name}
                  onChange={handleChange('company_name')}
                  onBlur={() => markTouched('company_name')}
                  type="text"
                  placeholder={t('profile.companyPlaceholder')}
                  aria-invalid={companyState.showError ? true : undefined}
                  aria-describedby={companyState.showError ? companyErrorId : undefined}
                  className="flex-1 bg-transparent outline-none text-sm font-semibold text-slate-700"
                />
                {companyState.showSuccess && (
                  <Check size={16} className="text-emerald-500" aria-hidden="true" />
                )}
              </div>
              {companyState.showError && companyError && (
                <p id={companyErrorId} className="text-[11px] font-semibold text-red-500 mt-2">
                  {companyError}
                </p>
              )}
            </label>
          )}

          <label className="block">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('profile.phoneLabel')}</span>
            <div className={getFieldClasses(phoneState.showError, phoneState.showSuccess)}>
              <Phone size={18} className="text-slate-400" />
              <input
                value={form.phone ?? ''}
                onChange={handleChange('phone')}
                onBlur={() => markTouched('phone')}
                type="tel"
                placeholder={t('profile.phonePlaceholder')}
                aria-invalid={phoneState.showError ? true : undefined}
                aria-describedby={phoneState.showError ? phoneErrorId : undefined}
                className="flex-1 bg-transparent outline-none text-sm font-semibold text-slate-700"
              />
              {phoneState.showSuccess && (
                <Check size={16} className="text-emerald-500" aria-hidden="true" />
              )}
            </div>
            {phoneState.showError && phoneError && (
              <p id={phoneErrorId} className="text-[11px] font-semibold text-red-500 mt-2">
                {phoneError}
              </p>
            )}
          </label>
        </fieldset>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={busy}
            className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-black active:scale-95 transition-transform disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            <XCircle size={18} /> {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-black active:scale-95 transition-transform disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            <Save size={18} /> {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>

      {msg && (
        <div className={`text-sm font-semibold border p-3 rounded-2xl ${messageClasses[msg.type]}`}>
          {t(msg.key)}
        </div>
      )}
    </div>
  );
};

export default ProfileView;
