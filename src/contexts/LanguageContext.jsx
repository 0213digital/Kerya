import React, { createContext, useState, useEffect, useContext } from 'react';
import { translations } from '../data/translations';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // The new translation function that handles nested keys
  const t = (key) => {
    const keys = key.split('.');
    let result = translations[language];
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        return key; // Return the key itself if not found
      }
    }
    return result;
  };

  const value = {
    language,
    setLanguage,
    t, // Now providing a function as 't'
  };

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