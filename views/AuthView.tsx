import React, { useEffect, useId, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, Check, LogIn, Mail, Lock, User, UserPlus } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import InstitutionPicker from '../components/InstitutionPicker';
import { getFieldState } from '../lib/fieldState';
import type { Institution } from '../types';
import { useI18n } from '../src/i18n/I18nContext';
import LanguageToggle from '../components/LanguageToggle';

const BLOCK_SESSION_KEY = 'isqm.blockNextSession';

const AuthView: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<{ key: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<{ key: string } | null>(null);
  const [userType, setUserType] = useState<'student' | 'worker' | ''>('');
  const [institutionId, setInstitutionId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const initialTouched = {
    email: false,
    password: false,
    userType: false,
    institutionId: false,
    companyName: false,
  };
  const [touched, setTouched] = useState(initialTouched);
  const [submitted, setSubmitted] = useState(false);

  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const isRegister = mode === 'register';

  const markTouched = (field: keyof typeof initialTouched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateEmail = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return t('auth.errorInvalidEmail');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return t('auth.errorInvalidEmail');
    return null;
  };

  const validatePassword = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 6) return t('auth.errorPasswordLength');
    return null;
  };

  const validateUserType = (value: string) => {
    if (!value.trim()) return t('auth.errorUserType');
    return null;
  };

  const validateInstitution = (value: string) => {
    if (!value.trim()) return t('auth.errorInstitution');
    return null;
  };

  const validateCompany = (value: string) => {
    if (!value.trim()) return t('auth.errorCompany');
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

  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  const userTypeError = isRegister ? validateUserType(userType) : null;
  const institutionError = isRegister && userType === 'student' ? validateInstitution(institutionId) : null;
  const companyError = isRegister && userType === 'worker' ? validateCompany(companyName) : null;

  const emailState = getFieldState({
    value: email,
    validator: validateEmail,
    touched: touched.email,
    submitted,
  });
  const passwordState = getFieldState({
    value: password,
    validator: validatePassword,
    touched: touched.password,
    submitted,
  });
  const userTypeState = getFieldState({
    value: userType,
    validator: isRegister ? validateUserType : () => null,
    touched: touched.userType,
    submitted,
  });
  const institutionState = getFieldState({
    value: institutionId,
    validator: isRegister && userType === 'student' ? validateInstitution : () => null,
    touched: touched.institutionId,
    submitted,
  });
  const companyState = getFieldState({
    value: companyName,
    validator: isRegister && userType === 'worker' ? validateCompany : () => null,
    touched: touched.companyName,
    submitted,
  });

  const emailErrorId = useId();
  const passwordErrorId = useId();
  const userTypeErrorId = useId();
  const companyErrorId = useId();

  const emailConfirmationMessage = (err: any) => {
    const message = (err?.message ?? '').toLowerCase();
    if (
      (message.includes('confirm') && message.includes('email')) ||
      message.includes('email not confirmed') ||
      (message.includes('verification') && message.includes('email'))
    ) {
      return 'auth.errorConfirmEmail';
    }
    return null;
  };

  const resolveInstitutionName = async () => {
    if (selectedInstitution?.name) return selectedInstitution.name;
    if (!institutionId) return null;
    const { data, error } = await supabase
      .from('institutions')
      .select('name')
      .eq('id', institutionId)
      .maybeSingle();
    if (error) {
      console.warn('Failed to load institution name', error);
      return null;
    }
    return data?.name ?? null;
  };

  useEffect(() => {
    setTouched(initialTouched);
    setSubmitted(false);
    setErrorMsg(null);
    if (mode === 'login') {
      setUserType('');
      setInstitutionId('');
      setCompanyName('');
      setSelectedInstitution(null);
    } else {
      setSuccessMsg(null);
    }
  }, [mode]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('registered') === '1') {
      setMode('login');
      setSuccessMsg({ key: 'auth.successRegistered' });
      setErrorMsg(null);
      return;
    }
    if (params.get('logged_out') === '1') {
      setMode('login');
      setSuccessMsg({ key: 'auth.successLoggedOut' });
      setErrorMsg(null);
      return;
    }
    if (params.get('profile_error') === '1') {
      setMode('login');
      setErrorMsg({ key: 'auth.errorProfileSetupFailed' });
      setSuccessMsg(null);
    }
  }, [location.search]);

  const handleUserTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'student' | 'worker' | '';
    setUserType(value);
    if (value === 'student') {
      setCompanyName('');
      setSelectedInstitution(null);
      setTouched((prev) => ({ ...prev, companyName: false }));
    } else if (value === 'worker') {
      setInstitutionId('');
      setSelectedInstitution(null);
      setTouched((prev) => ({ ...prev, institutionId: false }));
    } else {
      setCompanyName('');
      setInstitutionId('');
      setSelectedInstitution(null);
      setTouched((prev) => ({ ...prev, companyName: false, institutionId: false }));
    }
  };

  const onEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitted(true);

    const hasErrors = Boolean(
      emailError ||
      passwordError ||
      (mode === 'register' && userTypeError) ||
      (mode === 'register' && userType === 'student' && institutionError) ||
      (mode === 'register' && userType === 'worker' && companyError)
    );

    if (hasErrors) return;

    setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setErrorMsg({ key: 'auth.errorLoginFailed' });
          return;
        }
        navigate('/', { replace: true });
      } else {
        sessionStorage.setItem(BLOCK_SESSION_KEY, '1');
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          sessionStorage.removeItem(BLOCK_SESSION_KEY);
          const confirmKey = emailConfirmationMessage(error);
          setErrorMsg({ key: confirmKey ?? 'common.errorGeneric' });
          return;
        }
        if (!data.user) {
          sessionStorage.removeItem(BLOCK_SESSION_KEY);
          setErrorMsg({ key: 'auth.errorMissingUser' });
          return;
        }

        let profileUpsertFailed = false;
        if (userType) {
          const institutionName = userType === 'student' ? await resolveInstitutionName() : null;
          const profilePayload = {
            id: data.user.id,
            full_name: null,
            phone: null,
            user_type: userType,
            institution_id: userType === 'student' ? institutionId || null : null,
            company_name: userType === 'worker' ? companyName.trim() || null : null,
            institution: userType === 'student' ? institutionName : null,
            role: null,
          };

          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(profilePayload, { onConflict: 'id' });

          if (profileError) {
            setErrorMsg({ key: 'auth.errorProfileSetupFailed' });
            profileUpsertFailed = true;
          }
        }

        await supabase.auth.signOut();
        sessionStorage.removeItem(BLOCK_SESSION_KEY);
        setPassword('');
        setMode('login');
        setSuccessMsg({ key: 'auth.successRegistered' });
        const target = profileUpsertFailed ? '/login?profile_error=1' : '/login?registered=1';
        navigate(target, { replace: true });
      }
    } catch (err: any) {
      sessionStorage.removeItem(BLOCK_SESSION_KEY);
      const confirmKey = emailConfirmationMessage(err);
      setErrorMsg({ key: confirmKey ?? 'common.errorGeneric' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-5">
      <div className="w-full max-w-md bg-white rounded-3xl p-7 shadow-sm border border-slate-100">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
              <LogIn size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800">{t('common.appName')}</h1>
              <p className="text-xs text-slate-400">{t('auth.subtitle')}</p>
            </div>
          </div>
          <LanguageToggle />
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider ${
              mode === 'login' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {t('auth.loginTab')}
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider ${
              mode === 'register' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {t('auth.registerTab')}
          </button>
        </div>

        {successMsg && (
          <div className="mb-4 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
            {t(successMsg.key)}
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 p-3 rounded-2xl">
            {t(errorMsg.key)}
          </div>
        )}

        <form onSubmit={onEmailSubmit} noValidate className="space-y-3">
          {isRegister && (
            <>
              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('auth.userTypeLabel')}</span>
                {!userTypeState.showError && (
                  <p className="text-[11px] text-slate-400 mt-1">{t('common.requiredHint')}</p>
                )}
                <div className={getFieldClasses(userTypeState.showError, userTypeState.showSuccess)}>
                  <User size={18} className="text-slate-400" />
                  <select
                    value={userType}
                    onChange={handleUserTypeChange}
                    onBlur={() => markTouched('userType')}
                    aria-invalid={userTypeState.showError ? true : undefined}
                    aria-describedby={userTypeState.showError ? userTypeErrorId : undefined}
                    className="flex-1 bg-transparent outline-none text-sm font-semibold text-slate-700"
                  >
                    <option value="">{t('auth.userTypePlaceholder')}</option>
                    <option value="student">{t('auth.userTypeStudent')}</option>
                    <option value="worker">{t('auth.userTypeWorker')}</option>
                  </select>
                  {userTypeState.showSuccess && (
                    <Check size={16} className="text-emerald-500" aria-hidden="true" />
                  )}
                </div>
                {userTypeState.showError && userTypeError && (
                  <p id={userTypeErrorId} className="text-[11px] font-semibold text-red-500 mt-2">
                    {userTypeError}
                  </p>
                )}
              </label>

              {userType === 'student' && (
                <InstitutionPicker
                  valueInstitutionId={institutionId || null}
                  onChange={(inst) => {
                    setInstitutionId(inst?.id ?? '');
                    setSelectedInstitution(inst ?? null);
                    setTouched((prev) => ({ ...prev, institutionId: true }));
                  }}
                  onBlur={() => markTouched('institutionId')}
                  errorMessage={institutionError}
                  showError={institutionState.showError}
                  showSuccess={institutionState.showSuccess}
                  requiredHint={t('common.requiredHint')}
                  disabled={busy}
                />
              )}

              {userType === 'worker' && (
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('auth.companyLabel')}</span>
                  {!companyState.showError && (
                    <p className="text-[11px] text-slate-400 mt-1">{t('common.requiredHint')}</p>
                  )}
                  <div className={getFieldClasses(companyState.showError, companyState.showSuccess)}>
                    <Briefcase size={18} className="text-slate-400" />
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      onBlur={() => markTouched('companyName')}
                      type="text"
                      placeholder={t('auth.companyPlaceholder')}
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
            </>
          )}
          <label className="block">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('auth.emailLabel')}</span>
            {!emailState.showError && (
              <p className="text-[11px] text-slate-400 mt-1">{t('common.requiredHint')}</p>
            )}
            <div className={getFieldClasses(emailState.showError, emailState.showSuccess)}>
              <Mail size={18} className="text-slate-400" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => markTouched('email')}
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                aria-invalid={emailState.showError ? true : undefined}
                aria-describedby={emailState.showError ? emailErrorId : undefined}
                className="flex-1 bg-transparent outline-none text-sm font-semibold text-slate-700"
              />
              {emailState.showSuccess && (
                <Check size={16} className="text-emerald-500" aria-hidden="true" />
              )}
            </div>
            {emailState.showError && emailError && (
              <p id={emailErrorId} className="text-[11px] font-semibold text-red-500 mt-2">
                {emailError}
              </p>
            )}
          </label>

          <label className="block">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('auth.passwordLabel')}</span>
            {!passwordState.showError && (
              <p className="text-[11px] text-slate-400 mt-1">{t('common.requiredHint')}</p>
            )}
            <div className={getFieldClasses(passwordState.showError, passwordState.showSuccess)}>
              <Lock size={18} className="text-slate-400" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => markTouched('password')}
                type="password"
                placeholder={t('auth.passwordPlaceholder')}
                aria-invalid={passwordState.showError ? true : undefined}
                aria-describedby={passwordState.showError ? passwordErrorId : undefined}
                className="flex-1 bg-transparent outline-none text-sm font-semibold text-slate-700"
              />
              {passwordState.showSuccess && (
                <Check size={16} className="text-emerald-500" aria-hidden="true" />
              )}
            </div>
            {passwordState.showError && passwordError && (
              <p id={passwordErrorId} className="text-[11px] font-semibold text-red-500 mt-2">
                {passwordError}
              </p>
            )}
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black active:scale-95 transition-transform disabled:opacity-60"
          >
            {mode === 'login' ? (
              <span className="inline-flex items-center gap-2"><LogIn size={18} /> {t('auth.loginButton')}</span>
            ) : (
              <span className="inline-flex items-center gap-2"><UserPlus size={18} /> {t('auth.registerButton')}</span>
            )}
          </button>
        </form>

        <p className="mt-5 text-[11px] text-slate-400 leading-relaxed">
          {t('auth.tip')}
        </p>
      </div>
    </div>
  );
};

export default AuthView;
