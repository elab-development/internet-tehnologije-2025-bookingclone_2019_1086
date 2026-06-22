import { useState } from "react";
import { useTranslation } from "react-i18next";

import * as authService from "../services/authService";
import { setAccessToken, setAuthUser } from "../storage/authStorage";

type Role = "USER" | "HOST" | "ADMIN";

type Props = {
  onSuccess: () => void;
};

export default function RegisterForm({ onSuccess }: Props) {
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("USER");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await authService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() === "" ? null : phone.trim(),
        role,
      });

      if (response?.access_token) {
        setAccessToken(response.access_token);
      }

      const user = await authService.me();
      setAuthUser(user);

      onSuccess();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("auth.registrationFailed");

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
        <label className="auth-form__label">{t("auth.name")}</label>

        <input
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          placeholder={t("auth.namePlaceholder")}
          autoComplete="name"
          className="auth-form__input"
        />
      </div>

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
        <label className="auth-form__label">{t("auth.phoneOptional")}</label>

        <input
          name="phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+381..."
          autoComplete="tel"
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
          placeholder={t("auth.choosePassword")}
          autoComplete="new-password"
          className="auth-form__input"
        />
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label">{t("auth.role")}</label>

        <select
          value={role}
          onChange={(event) => setRole(event.target.value as Role)}
          className="auth-form__input auth-form__select"
        >
          <option value="USER">{t("roles.user")}</option>
          <option value="HOST">{t("roles.host")}</option>
          <option value="ADMIN">{t("roles.admin")}</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="auth-form__submit-button"
      >
        {isSubmitting ? t("auth.creatingAccount") : t("auth.registerTitle")}
      </button>
    </form>
  );
}