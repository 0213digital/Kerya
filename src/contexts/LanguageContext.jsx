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

  // FIX: Updated `t` function to handle interpolation
  const t = useCallback((key, options) => {
    const keys = key.split('.');
    let text = translations[language];
    for (const k of keys) {
      text = text?.[k];
      if (text === undefined) {
        // Improvement: Warn developers about missing keys
        console.warn(`Translation key not found: ${key}`); 
        return key; 
      }
    }

    // Perform interpolation if options are provided
    if (options && typeof text === 'string') {
      return text.replace(/{(\w+)}/g, (placeholder, placeholderKey) => {
        return options[placeholderKey] !== undefined ? options[placeholderKey] : placeholder;
      });
    }

    return text;
  }, [language]); // Re-create this function only when the language changes

  // IMPROVEMENT: Memoize the context value to prevent unnecessary re-renders
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