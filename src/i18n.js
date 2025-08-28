import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './data/translations';

// The resources object is structured as { language: { namespace: { key: value } } }
// We'll use a default namespace 'translation', which is the standard.
const resources = {
  en: {
    translation: translations.en
  },
  fr: {
    translation: translations.fr
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en', // Get language from storage or default
    fallbackLng: 'en', // Use 'en' if the detected language is not available

    interpolation: {
      escapeValue: false // React already protects from XSS
    },

    react: {
      useSuspense: false // Optional: set to false if you don't want to use Suspense
    }
  });

export default i18n;
