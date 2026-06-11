'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { t, type Locale, type TranslationKey } from '@/lib/i18n/translations';

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  tr: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const stored = localStorage.getItem('edle-locale') as Locale | null;
    if (stored === 'en' || stored === 'am') setLocaleState(stored);
  }, []);

  const setLocale = (value: Locale) => {
    setLocaleState(value);
    localStorage.setItem('edle-locale', value);
    document.documentElement.lang = value;
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const tr = (key: TranslationKey) => t(locale, key);

  return (
    <I18nContext.Provider value={{ locale, setLocale, tr }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
