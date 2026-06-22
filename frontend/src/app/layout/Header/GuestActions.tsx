import { useTranslation } from "react-i18next";

type Props = {
  onLoginClick: () => void;
  onRegisterClick: () => void;
};

export default function GuestActions({ onLoginClick, onRegisterClick }: Props) {
  const { t } = useTranslation();

  return (
    <div className="header__guest-actions">
      <button
        type="button"
        onClick={onRegisterClick}
        className="header__auth-button"
      >
        {t("auth.register")}
      </button>

      <button
        type="button"
        onClick={onLoginClick}
        className="header__auth-button"
      >
        {t("auth.signIn")}
      </button>
    </div>
  );
}