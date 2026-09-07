import { useTranslation } from "react-i18next";

import Pagination from "../../../shared/components/Pagination";
import ReviewDialog from "../../reviews/components/ReviewDialog";
import { useReviewDialog } from "../../reviews/hooks/useReviewDialog";
import ReservationCard from "../components/ReservationCard";
import ReservationsFilterBar from "../components/ReservationsFilterBar";
import {
  useReservationList,
  type ReservationScope,
} from "../hooks/useReservationList";
import type { ReservationDto } from "../services/reservationService";

import "../styles/ReservationsPage.css";

type Props = {
  scope: ReservationScope;
};

export default function ReservationsPage({ scope }: Props) {
  const { t } = useTranslation();

  const {
    items,
    filters,
    apartmentOptions,
    hasFilters,
    applyFilters,
    resetFilters,
    page,
    pageSize,
    total,
    isLoading,
    error,
    busyId,
    changeStatus,
    reload,
    goToPage,
    isEmpty,
  } = useReservationList(scope);

  const isHost = scope === "host";
  const review = useReviewDialog(reload);

  function handleConfirm(reservation: ReservationDto) {
    changeStatus(reservation, "confirmed");
  }

  function handleCancel(reservation: ReservationDto) {
    changeStatus(reservation, "cancelled");
  }

  function getEmptyMessage() {
    if (hasFilters) {
      return t("reservations.emptyFiltered");
    }

    return isHost ? t("reservations.emptyHost") : t("reservations.emptyGuest");
  }

  function renderState() {
    if (isLoading) {
      return (
        <p className="reservations-page__state">{t("reservations.loading")}</p>
      );
    }

    if (error) {
      return (
        <p className="reservations-page__state reservations-page__state--error">
          {error}
        </p>
      );
    }

    if (isEmpty) {
      return (
        <p className="reservations-page__state">
          {getEmptyMessage()}
        </p>
      );
    }

    return null;
  }

  return (
    <main className="reservations-page">
      <header className="reservations-page__header">
        <h1 className="reservations-page__title">
          {isHost ? t("reservations.hostTitle") : t("reservations.myTitle")}
        </h1>

        <p className="reservations-page__subtitle">
          {isHost
            ? t("reservations.hostSubtitle")
            : t("reservations.mySubtitle")}
        </p>
      </header>

      <ReservationsFilterBar
        filters={filters}
        apartmentOptions={apartmentOptions}
        hasFilters={hasFilters}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {renderState()}

      <div className="reservations-page__list">
        {items.map((reservation) => (
          <ReservationCard
            key={reservation.id}
            reservation={reservation}
            showGuest={isHost}
            busy={busyId === reservation.id}
            onConfirm={isHost ? handleConfirm : undefined}
            onCancel={handleCancel}
            onReview={isHost ? undefined : review.open}
          />
        ))}
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        disabled={isLoading || busyId !== null}
        onPageChange={goToPage}
      />

      <ReviewDialog
        open={review.isOpen}
        apartmentTitle={review.reservation?.apartment?.title ?? ""}
        initialRating={review.reservation?.review?.rating ?? null}
        initialComment={review.reservation?.review?.comment ?? null}
        busy={review.busy}
        error={review.error}
        onSubmit={review.submit}
        onCancel={review.close}
      />
    </main>
  );
}
