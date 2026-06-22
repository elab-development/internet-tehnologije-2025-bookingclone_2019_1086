import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import sr from "./locales/sr.json";

const supportedLanguages = ["en", "sr"] as const;

type SupportedLanguage = (typeof supportedLanguages)[number];

function getInitialLanguage(): SupportedLanguage {
  const savedLanguage = localStorage.getItem("language");

  if (savedLanguage === "en" || savedLanguage === "sr") {
    return savedLanguage;
  }

  const browserLanguage = navigator.language.toLowerCase();

  if (browserLanguage.startsWith("sr")) {
    return "sr";
  }

  return "en";
}

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
    sr: {
      translation: sr,
    },
  },
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export function changeLanguage(language: SupportedLanguage) {
  localStorage.setItem("language", language);
  i18n.changeLanguage(language);
}

export default i18n;