import { useTranslation } from "react-i18next";

import type { AuthMode } from "./AuthModal";

type Props = {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
};

export default function AuthSwitchHint({ mode, onModeChange }: Props) {
  const { t } = useTranslation();

  if (mode === "login") {
    return (
      <div className="auth-modal__switch">
        {t("auth.noAccount")}{" "}
        <button
          type="button"
          onClick={() => onModeChange("register")}
          className="auth-modal__switch-button"
        >
          {t("auth.register")}
        </button>
      </div>
    );
  }

  return (
    <div className="auth-modal__switch">
      {t("auth.hasAccount")}{" "}
      <button
        type="button"
        onClick={() => onModeChange("login")}
        className="auth-modal__switch-button"
      >
        {t("auth.signIn")}
      </button>
    </div>
  );
}