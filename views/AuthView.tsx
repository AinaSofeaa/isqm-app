import React, { useEffect, useState } from 'react';
import { Briefcase, LogIn, Mail, Lock, User, UserPlus } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import InstitutionPicker from '../components/InstitutionPicker';

const AuthView: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [userType, setUserType] = useState<'student' | 'worker' | ''>('');
  const [institutionId, setInstitutionId] = useState('');
  const [companyName, setCompanyName] = useState('');

  const isRegister = mode === 'register';

  useEffect(() => {
    if (mode === 'login') {
      setUserType('');
      setInstitutionId('');
      setCompanyName('');
    }
  }, [mode]);

  const handleUserTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'student' | 'worker' | '';
    setUserType(value);
    if (value === 'student') {
      setCompanyName('');
    } else if (value === 'worker') {
      setInstitutionId('');
    } else {
      setCompanyName('');
      setInstitutionId('');
    }
  };

  const onEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (mode === 'register') {
      if (!userType) {
        setMsg('Please select Jenis Pengguna.');
        return;
      }
      if (userType === 'student' && !institutionId) {
        setMsg('Please select an institution.');
        return;
      }
      if (userType === 'worker' && !companyName.trim()) {
        setMsg('Please enter your company or project name.');
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        let profileSaved = true;
        if (data.user) {
          const payload = {
            id: data.user.id,
            user_type: userType || null,
            institution_id: userType === 'student' ? institutionId : null,
            company_name: userType === 'worker' ? companyName.trim() : null,
          };
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(payload, { onConflict: 'id' });
          if (profileError) {
            console.warn('Profile upsert failed after sign up', profileError);
            profileSaved = false;
          }
        }

        if (profileSaved) {
          setMsg('Account created. Profile saved. If email confirmation is enabled, check your inbox.');
        } else {
          setMsg('Account created. If email confirmation is enabled, check your inbox. Complete your profile after signing in.');
        }
      }
    } catch (err: any) {
      setMsg(err?.message ?? 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-5">
      <div className="w-full max-w-md bg-white rounded-3xl p-7 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
            <LogIn size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">ISQM</h1>
            <p className="text-xs text-slate-400">Sign in to save & review calculations</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider ${
              mode === 'login' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider ${
              mode === 'register' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={onEmailSubmit} className="space-y-3">
          {isRegister && (
            <>
              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jenis Pengguna</span>
                <div className="mt-1 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                  <User size={18} className="text-slate-400" />
                  <select
                    value={userType}
                    onChange={handleUserTypeChange}
                    required
                    className="w-full bg-transparent outline-none text-sm font-semibold text-slate-700"
                  >
                    <option value="">Pilih jenis pengguna</option>
                    <option value="student">Pelajar TVET</option>
                    <option value="worker">Pekerja Tapak</option>
                  </select>
                </div>
              </label>

              {userType === 'student' && (
                <InstitutionPicker
                  valueInstitutionId={institutionId || null}
                  onChange={(inst) => setInstitutionId(inst?.id ?? '')}
                  disabled={busy}
                />
              )}

              {userType === 'worker' && (
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Syarikat/Projek</span>
                  <div className="mt-1 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                    <Briefcase size={18} className="text-slate-400" />
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      type="text"
                      required
                      placeholder="Contoh: ABC Construction"
                      className="w-full bg-transparent outline-none text-sm font-semibold text-slate-700"
                    />
                  </div>
                </label>
              )}
            </>
          )}
          <label className="block">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</span>
            <div className="mt-1 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
              <Mail size={18} className="text-slate-400" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="name@email.com"
                className="w-full bg-transparent outline-none text-sm font-semibold text-slate-700"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</span>
            <div className="mt-1 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
              <Lock size={18} className="text-slate-400" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                minLength={6}
                placeholder="min 6 characters"
                className="w-full bg-transparent outline-none text-sm font-semibold text-slate-700"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black active:scale-95 transition-transform disabled:opacity-60"
          >
            {mode === 'login' ? (
              <span className="inline-flex items-center gap-2"><LogIn size={18} /> Sign In</span>
            ) : (
              <span className="inline-flex items-center gap-2"><UserPlus size={18} /> Create Account</span>
            )}
          </button>
        </form>

        {msg && (
          <div className="mt-4 text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
            {msg}
          </div>
        )}

        <p className="mt-5 text-[11px] text-slate-400 leading-relaxed">
          Tip: For student demos, you can disable email confirmation in Supabase Auth settings to avoid the "check inbox" step.
        </p>
      </div>
    </div>
  );
};

export default AuthView;
