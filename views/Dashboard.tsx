
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Maximize, Columns, BookOpen, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { useI18n } from '../src/i18n/I18nContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user, profile, profileLoading } = useAuth();
  const [institutionName, setInstitutionName] = useState<string | null>(null);
  const displayName = profile?.full_name || user?.email;
  const showName = !profileLoading && !!profile;
  const showInstitutionLine = !profileLoading && profile?.user_type === 'student' && !!profile?.institution_id;
  const showCompanyLine = !profileLoading && profile?.user_type === 'worker' && !!profile?.company_name;

  useEffect(() => {
    if (profile?.user_type !== 'student' || !profile?.institution_id) {
      setInstitutionName(null);
      return;
    }
    let active = true;
    const load = async () => {
      const { data, error } = await supabase
        .from('institutions')
        .select('name')
        .eq('id', profile.institution_id)
        .maybeSingle();
      if (!active) return;
      if (error) {
        console.warn('Failed to load institution name', error);
        setInstitutionName(null);
      } else {
        setInstitutionName(data?.name ?? null);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [profile?.institution_id, profile?.user_type]);

  const menuItems = [
    {
      title: t('dashboard.cardColumnTitle'),
      desc: t('dashboard.cardColumnDesc'),
      icon: <Columns size={32} className="text-blue-600" />,
      path: '/column',
      color: 'bg-blue-50'
    },
    {
      title: t('dashboard.cardBeamTitle'),
      desc: t('dashboard.cardBeamDesc'),
      icon: <Maximize size={32} className="text-orange-600" />,
      path: '/beam',
      color: 'bg-orange-50'
    },
    {
      title: t('dashboard.cardSlabTitle'),
      desc: t('dashboard.cardSlabDesc'),
      icon: <Layers size={32} className="text-emerald-600" />,
      path: '/slab',
      color: 'bg-emerald-50'
    }
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Banner */}
      <section className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative shadow-lg">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">
            {showName
              ? t('dashboard.welcomeWithName', { name: displayName ?? '' })
              : t('dashboard.welcomeFallback')}
          </h2>
          {showInstitutionLine && (
            <p className="text-xs font-semibold text-slate-300 mb-2">
              {t('dashboard.institutionLine', { name: institutionName ?? '...' })}
            </p>
          )}
          {showCompanyLine && (
            <p className="text-xs font-semibold text-slate-300 mb-2">
              {t('dashboard.companyLine', { name: profile?.company_name ?? '' })}
            </p>
          )}
          <p className="text-slate-400 text-sm leading-relaxed max-w-[240px]">
            {t('dashboard.intro')}
          </p>
        </div>
        <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12">
          <BookOpen size={160} />
        </div>
      </section>

      {/* Main Calculators */}
      <section>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">
          {t('dashboard.toolsTitle')}
        </h3>
        <div className="grid gap-4">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className="flex items-center text-left p-4 bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-[0.98] transition-all"
            >
              <div className={`${item.color} p-4 rounded-xl mr-4`}>
                {item.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 text-lg">{item.title}</h4>
                <p className="text-slate-500 text-sm leading-tight">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Quick Stats / Info */}
      <section className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4">
        <div className="bg-yellow-100 p-3 rounded-full">
          <Clock size={24} className="text-yellow-700" />
        </div>
        <div>
          <h4 className="font-bold text-slate-800">{t('dashboard.quickTipTitle')}</h4>
          <p className="text-slate-600 text-sm mt-1">
            {t('dashboard.quickTipBody')}
          </p>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;

