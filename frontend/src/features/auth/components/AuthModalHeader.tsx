import { useTranslation } from "react-i18next";

type Props = {
  title: string;
  onClose: () => void;
};

export default function AuthModalHeader({ title, onClose }: Props) {
  const { t } = useTranslation();

  return (
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
  );
}