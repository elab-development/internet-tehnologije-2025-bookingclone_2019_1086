import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { ReservationDto } from "../../reservations/services/reservationService";
import { createReview } from "../services/reviewService";

/** Opens the rating dialog for one stay and saves what comes out of it.
 *
 * The reservation being rated is held here rather than on the page, so the
 * page only has to say which one was clicked and what to do once it is saved.
 */
export function useReviewDialog(onSaved: () => void) {
  const { t } = useTranslation();

  const [reservation, setReservation] = useState<ReservationDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function open(next: ReservationDto) {
    setError(null);
    setReservation(next);
  }

  function close() {
    if (busy) {
      return;
    }

    setReservation(null);
    setError(null);
  }

  async function submit(rating: number, comment: string) {
    if (!reservation || busy) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await createReview({
        reservation_id: reservation.id,
        rating,
        comment: comment.trim() ? comment.trim() : null,
      });

      setReservation(null);
      onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : t("reviews.errors.saveFailed")
      );
    } finally {
      setBusy(false);
    }
  }

  return {
    reservation,
    isOpen: reservation !== null,
    busy,
    error,
    open,
    close,
    submit,
  };
}
