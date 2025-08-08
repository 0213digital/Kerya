import React, { useState, createContext, useContext } from 'react';
import { translations } from '../data/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('fr');
    
    const t = (key, params = {}) => {
        let translation = translations[language][key] || key;
        Object.keys(params).forEach(p => { 
            translation = translation.replace(`{${p}}`, params[p]); 
        });
        return translation;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => useContext(LanguageContext);
