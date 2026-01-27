
import React from 'react';
import { Hammer, BookOpen, ShieldCheck, Target, GraduationCap } from 'lucide-react';
import { useI18n } from '../src/i18n/I18nContext';

const AboutView: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="p-6">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-blue-700 p-6 rounded-3xl shadow-xl shadow-blue-200 mb-4 rotate-3">
          <Hammer size={48} className="text-white" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">{t('about.title')}</h2>
        <p className="text-slate-500 text-sm text-center mt-2 max-w-[280px]">
          {t('about.subtitle')}
        </p>
      </div>

      <div className="space-y-6">
        <section className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-3 text-lg">
            <Target size={20} className="text-blue-600" />
            {t('about.projectObjectiveTitle')}
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            {t('about.projectObjectiveBody')}
          </p>
        </section>

        <section className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-3 text-lg">
            <ShieldCheck size={20} className="text-emerald-600" />
            {t('about.coreBenefitsTitle')}
          </h3>
          <ul className="space-y-2">
            {[
              t('about.benefit1'),
              t('about.benefit2'),
              t('about.benefit3'),
              t('about.benefit4'),
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                <div className="bg-emerald-100 text-emerald-600 p-0.5 rounded-full mt-0.5">
                  <BookOpen size={12} />
                </div>
                {text}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-3 text-lg">
            <GraduationCap size={20} className="text-orange-600" />
            {t('about.tvetTitle')}
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            {t('about.tvetBody')}
          </p>
        </section>

        <footer className="pt-4 text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            {t('about.footerLine1')}
          </p>
          <p className="text-slate-300 text-[10px] mt-1">
            {t('about.footerLine2')}
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AboutView;
