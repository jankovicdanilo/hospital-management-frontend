import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import me from './locales/me.json';

export const LANGUAGE_STORAGE_KEY = 'language';
export type Language = 'en' | 'me';

function getStoredLanguage(): Language {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === 'me' ? 'me' : 'en';
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    me: { translation: me },
  },
  lng: getStoredLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function setLanguage(language: Language) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  void i18n.changeLanguage(language);
}

export default i18n;
