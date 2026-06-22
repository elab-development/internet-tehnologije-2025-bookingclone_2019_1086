import React, { useEffect, useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

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
  const [mode, setMode] = useState<Mode>(defaultMode);

  useEffect(() => {
    if (open) setMode(defaultMode);
  }, [open, defaultMode]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const title = mode === "login" ? "Log in" : "Create account";

  function onBackdropMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      onMouseDown={onBackdropMouseDown}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(16,24,40,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        zIndex: 9999,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: 520,
          maxWidth: "92vw",
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #e5e7eb",
          boxShadow: "0 18px 40px rgba(16,24,40,0.18)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #eef2f7",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 800, color: "#111827" }}>{title}</div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              padding: 6,
              borderRadius: 10,
              color: "#111827",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 16 }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button
              type="button"
              onClick={() => setMode("login")}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 12,
                border:
                  mode === "login" ? "1px solid #111827" : "1px solid #e5e7eb",
                background: mode === "login" ? "#111827" : "#fff",
                color: mode === "login" ? "#fff" : "#111827",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => setMode("register")}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 12,
                border:
                  mode === "register"
                    ? "1px solid #111827"
                    : "1px solid #e5e7eb",
                background: mode === "register" ? "#111827" : "#fff",
                color: mode === "register" ? "#fff" : "#111827",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              Register
            </button>
          </div>

          {/* Content */}
          {mode === "login" ? (
            <LoginForm
              onSuccess={() => {
                onSuccess();
                onClose();
              }}
            />
          ) : (
            <RegisterForm
              onSuccess={() => {
                onSuccess();
                onClose();
              }}
            />
          )}

          {/* Switch hint */}
          <div style={{ marginTop: 14, fontSize: 14, color: "#475467" }}>
            {mode === "login" ? (
              <>
                Don’t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                    fontWeight: 800,
                    color: "#111827",
                  }}
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                    fontWeight: 800,
                    color: "#111827",
                  }}
                >
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
