import { useTranslation } from "react-i18next";

import Pagination from "../../../shared/components/Pagination";
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
    goToPage,
    isEmpty,
  } = useReservationList(scope);

  const isHost = scope === "host";

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
    </main>
  );
}
