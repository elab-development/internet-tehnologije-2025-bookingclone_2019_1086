import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import "./ConfirmDialog.css";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger,
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  // Escape closes the dialog, the way every other modal on the web does.
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, busy, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div className="confirm-dialog" role="presentation">
      <div
        className="confirm-dialog__backdrop"
        onClick={busy ? undefined : onCancel}
      />

      <div
        className="confirm-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <h2 className="confirm-dialog__title" id="confirm-dialog-title">
          {title}
        </h2>

        <p className="confirm-dialog__message">{message}</p>

        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={busy}
            onClick={onCancel}
          >
            {cancelLabel ?? t("common.cancel")}
          </button>

          <button
            type="button"
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            disabled={busy}
            onClick={onConfirm}
          >
            {confirmLabel ?? t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
