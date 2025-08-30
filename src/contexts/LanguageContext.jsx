// THIS FILE IS DEPRECATED AND WILL BE REMOVED.
// The application has been standardized to use `react-i18next` for all translations.
// Please use the `useTranslation` hook from `react-i18next` instead of this context.
//
// Example:
// import { useTranslation } from 'react-i18next';
// const { t } = useTranslation();
// return <h1>{t('myTranslationKey')}</h1>

import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { translations } from '../data/translations';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = useCallback((key, options) => {
    const keys = key.split('.');
    let text = translations[language];
    for (const k of keys) {
      if (text) {
        text = text[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    if (options && typeof text === 'string') {
      return text.replace(/{(\w+)}/g, (placeholder, placeholderKey) => {
        return options[placeholderKey] !== undefined ? options[placeholderKey] : placeholder;
      });
    }

    return text || key;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
  }), [language, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
