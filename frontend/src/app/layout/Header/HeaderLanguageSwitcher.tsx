import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  changeLanguage,
  getStoredLanguage,
  type SupportedLanguage,
} from "../../../i18n/i18n";

type LanguageOption = {
  code: SupportedLanguage;
  iso: "SRB" | "EN";
  labelKey: string;
};

const languages: LanguageOption[] = [
  {
    code: "sr",
    iso: "SRB",
    labelKey: "language.sr",
  },
  {
    code: "en",
    iso: "EN",
    labelKey: "language.en",
  },
];

function getDefaultLanguage(): SupportedLanguage {
  return "en";
}

function getCurrentLanguageCode(): SupportedLanguage {
  const storedLanguage = getStoredLanguage();

  if (storedLanguage) {
    return storedLanguage;
  }

  return getDefaultLanguage();
}

function getLanguageByCode(code: SupportedLanguage): LanguageOption {
  const language = languages.find((item) => item.code === code);

  if (language) {
    return language;
  }

  return languages[1];
}

function getLanguageOptionClassName(
  language: LanguageOption,
  currentLanguage: LanguageOption
) {
  const classNames = ["header__language-option"];

  if (language.code === currentLanguage.code) {
    classNames.push("header__language-option--active");
  }

  return classNames.join(" ");
}

export default function HeaderLanguageSwitcher() {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [selectedLanguageCode, setSelectedLanguageCode] =
    useState<SupportedLanguage>(getCurrentLanguageCode);

  const switcherRef = useRef<HTMLDivElement | null>(null);

  const currentLanguage = getLanguageByCode(selectedLanguageCode);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!switcherRef.current) {
        return;
      }

      if (!switcherRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function toggleDropdown() {
    setOpen((value) => !value);
  }

  function closeDropdown() {
    setOpen(false);
  }

  function handleLanguageChange(language: LanguageOption) {
    changeLanguage(language.code);
    setSelectedLanguageCode(language.code);
    closeDropdown();
  }

  function renderDropdown() {
    if (!open) {
      return null;
    }

    return (
      <div className="header__language-dropdown" role="listbox">
        {languages.map((language) => (
          <button
            key={language.code}
            type="button"
            className={getLanguageOptionClassName(language, currentLanguage)}
            onClick={() => handleLanguageChange(language)}
            role="option"
            aria-selected={language.code === currentLanguage.code}
          >
            <span className="header__language-option-code">
              {language.iso}
            </span>

            <span className="header__language-label">
              {t(language.labelKey)}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={switcherRef} className="header__language-switcher">
      <button
        type="button"
        className="header__language-current"
        onClick={toggleDropdown}
        aria-label="Change language"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {currentLanguage.iso}
      </button>

      {renderDropdown()}
    </div>
  );
}