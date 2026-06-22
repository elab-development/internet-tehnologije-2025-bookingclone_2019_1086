import { useTranslation } from "react-i18next";

import type { AuthMode } from "./AuthModal";

type Props = {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
};

export default function AuthTabs({ mode, onModeChange }: Props) {
  const { t } = useTranslation();

  function getTabClassName(tabMode: AuthMode) {
    if (mode === tabMode) {
      return "auth-modal__tab auth-modal__tab--active";
    }

    return "auth-modal__tab";
  }

  return (
    <div className="auth-modal__tabs">
      <button
        type="button"
        onClick={() => onModeChange("login")}
        className={getTabClassName("login")}
      >
        {t("auth.signIn")}
      </button>

      <button
        type="button"
        onClick={() => onModeChange("register")}
        className={getTabClassName("register")}
      >
        {t("auth.register")}
      </button>
    </div>
  );
}