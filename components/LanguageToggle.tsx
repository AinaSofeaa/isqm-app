import React from 'react';
import { useI18n } from '../src/i18n/I18nContext';

type LanguageToggleProps = {
  className?: string;
};

const LanguageToggle: React.FC<LanguageToggleProps> = ({ className }) => {
  const { lang, setLang } = useI18n();

  return (
    <div
      className={`inline-flex items-center rounded-full bg-slate-100 p-1 text-xs font-bold ${className ?? ''}`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLang('ms')}
        aria-pressed={lang === 'ms'}
        className={`px-3 py-1 rounded-full transition-colors ${
          lang === 'ms'
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:text-slate-800'
        }`}
      >
        BM
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className={`px-3 py-1 rounded-full transition-colors ${
          lang === 'en'
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:text-slate-800'
        }`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageToggle;
