

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import translationEN from "./locales/en/translation.json";
import translationBN from "./locales/bn/translation.json";

// the translations
const resources = {
  en: {
    translation: translationEN,
  },
  bn: {
    translation: translationBN,
  },
};

i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
  .init({
    resources,
    fallbackLng: "en",
    debug: false,

    interpolation: {
      escapeValue: false, // react already safes from xss
    },

    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
