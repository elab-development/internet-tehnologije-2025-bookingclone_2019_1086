import { useState } from "react";
import { useTranslation } from "react-i18next";

import * as authService from "../services/authService";
import { useAuth } from "../hooks/useAuth";
import { useAuthSubmit } from "../hooks/useAuthSubmit";

import AuthField from "./AuthField";
import AuthFormError from "./AuthFormError";

type Props = {
  onSuccess: () => void;
};

export default function LoginForm({ onSuccess }: Props) {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signIn } = useAuth();
  const { error, isSubmitting, submit } = useAuthSubmit(t("auth.loginFailed"));

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    submit(async () => {
      const response = await authService.login(
        email.trim().toLowerCase(),
        password
      );

      signIn(response.access_token, response.user);

      onSuccess();
    });
  }

  function getSubmitButtonText() {
    if (isSubmitting) {
      return t("auth.signingIn");
    }

    return t("auth.signIn");
  }

  return (
    <form onSubmit={onSubmit} className="auth-form">
      <AuthFormError message={error} />

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
        label={t("auth.password")}
        name="password"
        type="password"
        value={password}
        onChange={setPassword}
        required
        disabled={isSubmitting}
        placeholder={t("auth.passwordPlaceholder")}
        autoComplete="current-password"
      />

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
