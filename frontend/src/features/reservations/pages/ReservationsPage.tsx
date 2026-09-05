import { useTranslation } from "react-i18next";

import ReservationCard from "../components/ReservationCard";
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

  const { items, isLoading, error, busyId, changeStatus, isEmpty } =
    useReservationList(scope);

  const isHost = scope === "host";

  function handleConfirm(reservation: ReservationDto) {
    changeStatus(reservation, "confirmed");
  }

  function handleCancel(reservation: ReservationDto) {
    changeStatus(reservation, "cancelled");
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
          {isHost ? t("reservations.emptyHost") : t("reservations.emptyGuest")}
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
    </main>
  );
}
