import { useState } from "react";
import { useTranslation } from "react-i18next";

import * as authService from "../services/authService";
import { setAccessToken, setAuthUser } from "../storage/authStorage";

type Props = {
  onSuccess: () => void;
};

export default function LoginForm({ onSuccess }: Props) {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await authService.login(
        email.trim().toLowerCase(),
        password
      );

      setAccessToken(response.access_token);

      const user = await authService.me();
      setAuthUser(user);

      onSuccess();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("auth.loginFailed");

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="auth-form">
      {error ? (
        <div className="auth-form__error">
          <strong>{t("common.error")}:</strong> {error}
        </div>
      ) : null}

      <div className="auth-form__field">
        <label className="auth-form__label">{t("auth.email")}</label>

        <input
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder={t("auth.emailPlaceholder")}
          autoComplete="email"
          className="auth-form__input"
        />
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label">{t("auth.password")}</label>

        <input
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          placeholder={t("auth.passwordPlaceholder")}
          autoComplete="current-password"
          className="auth-form__input"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="auth-form__submit-button"
      >
        {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
      </button>
    </form>
  );
}