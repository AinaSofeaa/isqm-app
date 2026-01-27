import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { translations } from './translations';

export type Language = keyof typeof translations;

type TranslateParams = Record<string, string | number>;

type I18nContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, params?: TranslateParams) => string;
};

const STORAGE_KEY = 'isqm_lang';

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const getInitialLang = (): Language => {
  if (typeof window === 'undefined') return 'ms';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'en' ? 'en' : 'ms';
};

const resolveKey = (obj: Record<string, any>, key: string): string | undefined => {
  let current: any = obj;
  for (const part of key.split('.')) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
};

const interpolate = (template: string, params?: TranslateParams) => {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = params[key];
    return value === undefined || value === null ? '' : String(value);
  });
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(getInitialLang);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const t = useCallback((key: string, params?: TranslateParams) => {
    const value = resolveKey(translations[lang] as Record<string, any>, key);
    if (typeof value !== 'string') return key;
    return interpolate(value, params);
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
};
