import { useTranslation } from "react-i18next";

type AuthFormErrorProps = {
  message: string | null;
};

export default function AuthFormError({ message }: AuthFormErrorProps) {
  const { t } = useTranslation();

  if (!message) {
    return null;
  }

  return (
    <div className="auth-form__error" role="alert">
      <strong>{t("common.error")}:</strong> {message}
    </div>
  );
}
