import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import alTranslations from './locales/al.json';
import enTranslations from './locales/en.json';
import srTranslations from './locales/sr.json';

const LANGUAGE_STORAGE_KEY = '@berberi_language';

// Initialize i18n with default language first
i18n
  .use(initReactI18next)
  .init({
    resources: {
      al: {
        translation: alTranslations,
      },
      en: {
        translation: enTranslations,
      },
      sr: {
        translation: srTranslations,
      },
    },
    lng: 'al', // Default to Albanian
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Load saved language after initialization
const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && ['al', 'en', 'sr'].includes(savedLanguage)) {
      i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.error('Error loading saved language:', error);
  }
};

// Load language on module load
loadSavedLanguage();

// Export function to save language
export const saveLanguage = async (language) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    i18n.changeLanguage(language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

export default i18n;

