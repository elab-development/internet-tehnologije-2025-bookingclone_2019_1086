import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import sr from "./locales/sr.json";

const supportedLanguages = ["en", "sr"] as const;
const LANGUAGE_STORAGE_KEY = "language";

export type SupportedLanguage = (typeof supportedLanguages)[number];

export function isSupportedLanguage(
  language: string | null
): language is SupportedLanguage {
  if (language === "en") {
    return true;
  }

  if (language === "sr") {
    return true;
  }

  return false;
}

export function getStoredLanguage(): SupportedLanguage | null {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (isSupportedLanguage(savedLanguage)) {
    return savedLanguage;
  }

  return null;
}

function getBrowserLanguage(): SupportedLanguage {
  const browserLanguage = navigator.language.toLowerCase();

  if (browserLanguage.startsWith("sr")) {
    return "sr";
  }

  return "en";
}

function getInitialLanguage(): SupportedLanguage {
  const storedLanguage = getStoredLanguage();

  if (storedLanguage) {
    return storedLanguage;
  }

  return getBrowserLanguage();
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
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  i18n.changeLanguage(language);
}

export default i18n;