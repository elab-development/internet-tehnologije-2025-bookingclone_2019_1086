import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { formatApartmentPrice } from "../../apartments/services/apartmentService";
import type { ReservationDto } from "../services/reservationService";

const FALLBACK_IMAGE = "https://picsum.photos/300/200";

type Props = {
  reservation: ReservationDto;
  showGuest?: boolean;
  busy?: boolean;
  onConfirm?: (reservation: ReservationDto) => void;
  onCancel?: (reservation: ReservationDto) => void;
  onReview?: (reservation: ReservationDto) => void;
};

function formatDate(value: string) {
  const parts = value.split("-");

  if (parts.length !== 3) {
    return value;
  }

  return `${parts[2]}.${parts[1]}.${parts[0]}.`;
}

export default function ReservationCard({
  reservation,
  showGuest,
  busy,
  onConfirm,
  onCancel,
  onReview,
}: Props) {
  const { t } = useTranslation();

  const apartment = reservation.apartment;
  const isCancelled = reservation.status === "cancelled";
  const isPending = reservation.status === "pending";

  function getStatusClassName() {
    return `reservation-card__status reservation-card__status--${reservation.status}`;
  }

  function renderTitle() {
    if (!apartment) {
      return t("reservations.deletedApartment");
    }

    // A deleted apartment keeps its name here, but it has no page to open.
    if (apartment.is_deleted) {
      return (
        <>
          {apartment.title}{" "}
          <span className="reservation-card__removed">
            ({t("reservations.deletedApartment")})
          </span>
        </>
      );
    }

    return <Link to={`/apartments/${apartment.id}`}>{apartment.title}</Link>;
  }

  function renderReview() {
    if (!onReview) {
      return null;
    }

    if (reservation.review) {
      return (
        <div className="reservation-card__review">
          <span className="reservation-card__review-score">
            {reservation.review.rating}
          </span>

          <button
            type="button"
            className="btn btn-sm btn-link p-0"
            disabled={busy}
            onClick={() => onReview(reservation)}
          >
            {t("reviews.editMine")}
          </button>
        </div>
      );
    }

    if (!reservation.is_reviewable) {
      return null;
    }

    return (
      <button
        type="button"
        className="btn btn-sm btn-outline-primary"
        disabled={busy}
        onClick={() => onReview(reservation)}
      >
        {t("reviews.rateStay")}
      </button>
    );
  }

  function renderActions() {
    if (isCancelled) {
      return null;
    }

    return (
      <div className="reservation-card__actions">
        {renderReview()}

        {onConfirm && isPending ? (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            disabled={busy}
            onClick={() => onConfirm(reservation)}
          >
            {t("reservations.actions.confirm")}
          </button>
        ) : null}

        {onCancel ? (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            disabled={busy}
            onClick={() => onCancel(reservation)}
          >
            {t("reservations.actions.cancel")}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <article className="reservation-card">
      <img
        className="reservation-card__image"
        src={apartment?.image_url ?? FALLBACK_IMAGE}
        alt={apartment?.title ?? ""}
      />

      <div className="reservation-card__body">
        <div className="reservation-card__top">
          <h3 className="reservation-card__title">{renderTitle()}</h3>

          <span className={getStatusClassName()}>
            {t(`reservations.status.${reservation.status}`)}
          </span>
        </div>

        {apartment ? (
          <p className="reservation-card__location">
            {apartment.city}, {apartment.country}
          </p>
        ) : null}

        <p className="reservation-card__dates">
          {formatDate(reservation.check_in)} – {formatDate(reservation.check_out)}
          {" · "}
          {t("reservations.nights", { count: reservation.nights })}
          {" · "}
          {t("reservations.guests", { count: reservation.guests_count })}
        </p>

        {showGuest && reservation.guest_name ? (
          <p className="reservation-card__guest">
            {t("reservations.guestLabel")}: {reservation.guest_name}
          </p>
        ) : null}

        <div className="reservation-card__bottom">
          <span className="reservation-card__price">
            {formatApartmentPrice(reservation.total_price)}
          </span>

          {renderActions()}
        </div>
      </div>
    </article>
  );
}
