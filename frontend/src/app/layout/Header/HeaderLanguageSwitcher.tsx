import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { changeLanguage } from "../../../i18n/i18n";

type LanguageOption = {
  code: "sr" | "en";
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

export default function HeaderLanguageSwitcher() {
  const { t, i18n } = useTranslation();

  const [open, setOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement | null>(null);

  const currentLanguageCode = i18n.language === "sr" ? "sr" : "en";

  const currentLanguage =
    languages.find((language) => language.code === currentLanguageCode) ??
    languages[1];

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

  function handleLanguageChange(language: LanguageOption) {
    changeLanguage(language.code);
    setOpen(false);
  }

  return (
    <div ref={switcherRef} className="header__language-switcher">
      <button
        type="button"
        className="header__language-current"
        onClick={() => setOpen((value) => !value)}
        aria-label="Change language"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {currentLanguage.iso}
      </button>

      {open ? (
        <div className="header__language-dropdown" role="listbox">
          {languages.map((language) => (
            <button
              key={language.code}
              type="button"
              className={
                language.code === currentLanguage.code
                  ? "header__language-option header__language-option--active"
                  : "header__language-option"
              }
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
      ) : null}
    </div>
  );
}