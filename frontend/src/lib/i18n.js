import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import your translation JSON files
import enLabels from "../locales/en.json";
import bnLabels from "../locales/bn.json";

i18n
  .use(LanguageDetector) // Automatically detects user language
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources: {
      en: { translation: enLabels },
      bn: { translation: bnLabels },
    },
    fallbackLng: "en",
    debug: false, // Set to true to see logs in console
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
