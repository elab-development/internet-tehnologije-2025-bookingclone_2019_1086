import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import AuthModalHeader from "./AuthModalHeader";
import AuthTabs from "./AuthTabs";
import AuthSwitchHint from "./AuthSwitchHint";

import "./AuthModal.css";

export type AuthMode = "login" | "register";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  defaultMode?: AuthMode;
  onSuccess: () => void;
};

export default function AuthModal({
  open,
  onClose,
  defaultMode = "login",
  onSuccess,
}: AuthModalProps) {
  const { t } = useTranslation();

  const [mode, setMode] = useState<AuthMode>(defaultMode);

  useEffect(() => {
    if (open) {
      setMode(defaultMode);
    }
  }, [open, defaultMode]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  function getTitle() {
    if (mode === "login") {
      return t("auth.loginTitle");
    }

    return t("auth.registerTitle");
  }

  function onBackdropMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  function handleSuccess() {
    onSuccess();
    onClose();
  }

  function renderForm() {
    if (mode === "login") {
      return <LoginForm onSuccess={handleSuccess} />;
    }

    return <RegisterForm onSuccess={handleSuccess} />;
  }

  const title = getTitle();

  return (
    <div className="auth-modal-backdrop" onMouseDown={onBackdropMouseDown}>
      <div
        className="auth-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <AuthModalHeader title={title} onClose={onClose} />

        <div className="auth-modal__body">
          <AuthTabs mode={mode} onModeChange={setMode} />

          {renderForm()}

          <AuthSwitchHint mode={mode} onModeChange={setMode} />
        </div>
      </div>
    </div>
  );
}