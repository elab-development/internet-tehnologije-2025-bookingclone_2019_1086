import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

import "./AuthModal.css";

type Mode = "login" | "register";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  defaultMode?: Mode;
  onSuccess: () => void;
};

export default function AuthModal({
  open,
  onClose,
  defaultMode = "login",
  onSuccess,
}: AuthModalProps) {
  const { t } = useTranslation();

  const [mode, setMode] = useState<Mode>(defaultMode);

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

  const title =
    mode === "login" ? t("auth.loginTitle") : t("auth.registerTitle");

  function onBackdropMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  function handleSuccess() {
    onSuccess();
    onClose();
  }

  return (
    <div className="auth-modal-backdrop" onMouseDown={onBackdropMouseDown}>
      <div
        className="auth-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="auth-modal__header">
          <div>
            <p className="auth-modal__eyebrow">{t("auth.modalEyebrow")}</p>
            <h2 className="auth-modal__title">{title}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="auth-modal__close-button"
          >
            ✕
          </button>
        </div>

        <div className="auth-modal__body">
          <div className="auth-modal__tabs">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={
                mode === "login"
                  ? "auth-modal__tab auth-modal__tab--active"
                  : "auth-modal__tab"
              }
            >
              {t("auth.signIn")}
            </button>

            <button
              type="button"
              onClick={() => setMode("register")}
              className={
                mode === "register"
                  ? "auth-modal__tab auth-modal__tab--active"
                  : "auth-modal__tab"
              }
            >
              {t("auth.register")}
            </button>
          </div>

          {mode === "login" ? (
            <LoginForm onSuccess={handleSuccess} />
          ) : (
            <RegisterForm onSuccess={handleSuccess} />
          )}

          <div className="auth-modal__switch">
            {mode === "login" ? (
              <>
                {t("auth.noAccount")}{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="auth-modal__switch-button"
                >
                  {t("auth.register")}
                </button>
              </>
            ) : (
              <>
                {t("auth.hasAccount")}{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="auth-modal__switch-button"
                >
                  {t("auth.signIn")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}