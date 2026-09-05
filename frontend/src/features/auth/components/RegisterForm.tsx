import { useState } from "react";
import { useTranslation } from "react-i18next";

import * as authService from "../services/authService";
import { useAuth } from "../hooks/useAuth";
import { useAuthSubmit } from "../hooks/useAuthSubmit";

import AuthField from "./AuthField";
import AuthFormError from "./AuthFormError";

import type { Role } from "../types/authTypes";

const MIN_PASSWORD_LENGTH = 8;

type Props = {
  onSuccess: () => void;
};

export default function RegisterForm({ onSuccess }: Props) {
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("USER");

  const { signIn } = useAuth();
  const { error, isSubmitting, submit } = useAuthSubmit(
    t("auth.registrationFailed")
  );

  function getPhoneValue() {
    const trimmedPhone = phone.trim();

    if (trimmedPhone === "") {
      return null;
    }

    return trimmedPhone;
  }

  function validate() {
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(
        t("auth.passwordTooShort", { count: MIN_PASSWORD_LENGTH })
      );
    }

    if (password !== confirmPassword) {
      throw new Error(t("auth.passwordsDoNotMatch"));
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    submit(async () => {
      validate();

      const response = await authService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: getPhoneValue(),
        role,
      });

      signIn(response.access_token, response.user);

      onSuccess();
    });
  }

  function getSubmitButtonText() {
    if (isSubmitting) {
      return t("auth.creatingAccount");
    }

    return t("auth.registerTitle");
  }

  return (
    <form onSubmit={onSubmit} className="auth-form">
      <AuthFormError message={error} />

      <AuthField
        label={t("auth.name")}
        name="name"
        value={name}
        onChange={setName}
        required
        disabled={isSubmitting}
        placeholder={t("auth.namePlaceholder")}
        autoComplete="name"
      />

      <AuthField
        label={t("auth.email")}
        name="email"
        type="email"
        value={email}
        onChange={setEmail}
        required
        disabled={isSubmitting}
        placeholder={t("auth.emailPlaceholder")}
        autoComplete="email"
      />

      <AuthField
        label={t("auth.phoneOptional")}
        name="phone"
        type="tel"
        value={phone}
        onChange={setPhone}
        disabled={isSubmitting}
        placeholder="+381..."
        autoComplete="tel"
      />

      <AuthField
        label={t("auth.password")}
        name="password"
        type="password"
        value={password}
        onChange={setPassword}
        required
        disabled={isSubmitting}
        placeholder={t("auth.choosePassword")}
        autoComplete="new-password"
      />

      <AuthField
        label={t("auth.confirmPassword")}
        name="confirmPassword"
        type="password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        required
        disabled={isSubmitting}
        placeholder={t("auth.confirmPasswordPlaceholder")}
        autoComplete="new-password"
      />

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="role">
          {t("auth.role")}
        </label>

        <select
          id="role"
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value as Role)}
          disabled={isSubmitting}
          className="auth-form__input auth-form__select"
        >
          <option value="USER">{t("roles.user")}</option>
          <option value="HOST">{t("roles.host")}</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="auth-form__submit-button"
      >
        {getSubmitButtonText()}
      </button>
    </form>
  );
}
