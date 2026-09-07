import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { MAX_RATING, MIN_RATING } from "../services/reviewService";
import { ratingWordKey } from "../utils/ratingFormat";

import "../../../shared/components/ConfirmDialog.css";
import "../styles/Reviews.css";

type Props = {
  open: boolean;
  apartmentTitle: string;
  initialRating: number | null;
  initialComment: string | null;
  busy: boolean;
  error: string | null;
  onSubmit: (rating: number, comment: string) => void;
  onCancel: () => void;
};

const RATINGS = Array.from(
  { length: MAX_RATING - MIN_RATING + 1 },
  (_, index) => MIN_RATING + index
);

export default function ReviewDialog({
  open,
  apartmentTitle,
  initialRating,
  initialComment,
  busy,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const { t } = useTranslation();

  const [rating, setRating] = useState<number | null>(initialRating);
  const [comment, setComment] = useState(initialComment ?? "");

  useEffect(() => {
    setRating(initialRating);
    setComment(initialComment ?? "");
  }, [initialRating, initialComment, open]);

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

  const wordKey = rating === null ? null : ratingWordKey(rating);

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
        aria-labelledby="review-dialog-title"
      >
        <h2 className="confirm-dialog__title" id="review-dialog-title">
          {t("reviews.dialog.title")}
        </h2>

        <p className="confirm-dialog__message">
          {t("reviews.dialog.subtitle", { apartment: apartmentTitle })}
        </p>

        <div className="review-form__ratings">
          {RATINGS.map((value) => (
            <button
              key={value}
              type="button"
              className={
                value === rating
                  ? "review-form__rating review-form__rating--active"
                  : "review-form__rating"
              }
              disabled={busy}
              onClick={() => setRating(value)}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="review-form__word">
          {wordKey ? t(`reviews.words.${wordKey}`) : t("reviews.dialog.pick")}
        </div>

        <textarea
          className="review-form__comment"
          placeholder={t("reviews.dialog.commentPlaceholder")}
          maxLength={2000}
          value={comment}
          disabled={busy}
          onChange={(event) => setComment(event.target.value)}
        />

        {error ? <p className="review-form__error">{error}</p> : null}

        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={busy}
            onClick={onCancel}
          >
            {t("common.cancel")}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || rating === null}
            onClick={() => rating !== null && onSubmit(rating, comment)}
          >
            {busy ? t("reviews.dialog.saving") : t("reviews.dialog.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
