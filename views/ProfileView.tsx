import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Mail, Phone, Save, User as UserIcon, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import InstitutionPicker from '../components/InstitutionPicker';

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
  const { user, profile, profileLoading, updateProfile } = useAuth();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const busy = saving || profileLoading;

  useEffect(() => {
    setForm({
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      user_type: profile?.user_type ?? '',
      institution_id: profile?.institution_id ?? '',
      company_name: profile?.company_name ?? '',
    });
  }, [profile]);

  const messageClasses = useMemo(() => ({
    success: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    error: 'text-red-600 bg-red-50 border-red-100',
    info: 'text-slate-600 bg-slate-50 border-slate-100',
  }), []);

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
  };

  const handleReset = () => {
    setForm({
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      user_type: profile?.user_type ?? '',
      institution_id: profile?.institution_id ?? '',
      company_name: profile?.company_name ?? '',
    });
    setMsg({ type: 'info', text: 'Changes discarded.' });
  };

  const isPhoneValid = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return true;
    return /^[0-9+()\-\s]{6,}$/.test(trimmed);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!user) {
      setMsg({ type: 'error', text: 'You need to sign in again to update your profile.' });
      return;
    }

    if (!isPhoneValid(form.phone ?? '')) {
      setMsg({ type: 'error', text: 'Phone looks unusual. Use digits, spaces, +, -, or ().' });
      return;
    }

    if (form.user_type === 'student' && !form.institution_id) {
      setMsg({ type: 'error', text: 'Please select an institution.' });
      return;
    }

    if (form.user_type === 'worker' && !form.company_name.trim()) {
      setMsg({ type: 'error', text: 'Please enter your company or project name.' });
      return;
    }

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
      setMsg({ type: 'success', text: 'Profile saved.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message ?? 'Could not save profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <section className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
            <UserIcon size={22} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">My Profile</h2>
            <p className="text-xs text-slate-400">Update your personal details for saved calculations.</p>
          </div>
        </div>
      </section>

      {!profileLoading && user && !profile && (
        <div className="text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
          We could not load your profile yet. You can still save to create one.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <fieldset disabled={busy} className="space-y-4">
          <label className="block">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</span>
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
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</span>
            <div className="mt-1 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
              <UserIcon size={18} className="text-slate-400" />
              <input
                value={form.full_name ?? ''}
                onChange={handleChange('full_name')}
                type="text"
                placeholder="Your name (optional)"
                className="w-full bg-transparent outline-none text-sm font-semibold text-slate-700"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jenis Pengguna</span>
            <div className="mt-1 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
              <UserIcon size={18} className="text-slate-400" />
              <select
                value={form.user_type}
                onChange={handleUserTypeChange}
                className="w-full bg-transparent outline-none text-sm font-semibold text-slate-700"
              >
                <option value="">Pilih jenis pengguna</option>
                <option value="student">Pelajar TVET</option>
                <option value="worker">Pekerja Tapak</option>
              </select>
            </div>
          </label>

          {form.user_type === 'student' && (
            <InstitutionPicker
              valueInstitutionId={form.institution_id || null}
              onChange={(inst) => setForm((prev) => ({ ...prev, institution_id: inst?.id ?? '' }))}
              disabled={busy}
            />
          )}

          {form.user_type === 'worker' && (
            <label className="block">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Syarikat/Projek</span>
              <div className="mt-1 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                <Briefcase size={18} className="text-slate-400" />
                <input
                  value={form.company_name}
                  onChange={handleChange('company_name')}
                  type="text"
                  placeholder="Contoh: ABC Construction"
                  className="w-full bg-transparent outline-none text-sm font-semibold text-slate-700"
                />
              </div>
            </label>
          )}

          <label className="block">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</span>
            <div className="mt-1 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
              <Phone size={18} className="text-slate-400" />
              <input
                value={form.phone ?? ''}
                onChange={handleChange('phone')}
                type="tel"
                placeholder="Optional"
                className="w-full bg-transparent outline-none text-sm font-semibold text-slate-700"
              />
            </div>
          </label>
        </fieldset>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={busy}
            className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-black active:scale-95 transition-transform disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            <XCircle size={18} /> Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-black active:scale-95 transition-transform disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            <Save size={18} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>

      {msg && (
        <div className={`text-sm font-semibold border p-3 rounded-2xl ${messageClasses[msg.type]}`}>
          {msg.text}
        </div>
      )}
    </div>
  );
};

export default ProfileView;
