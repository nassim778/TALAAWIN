import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import strings from './strings';

const STORAGE_KEY = '@talaawin_lang';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'ar' || saved === 'en') setLang(saved);
      })
      .finally(() => setReady(true));
  }, []);

  const toggleLanguage = () => {
    const next = lang === 'en' ? 'ar' : 'en';
    setLang(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const value = useMemo(() => {
    const isRTL = lang === 'ar';
    const t = (key) => strings[lang]?.[key] ?? strings.en[key] ?? key;
    return { lang, isRTL, t, toggleLanguage };
  }, [lang]);

  if (!ready) return null;
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
