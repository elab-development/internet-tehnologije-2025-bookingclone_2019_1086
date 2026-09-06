import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../auth/hooks/useAuth";
import ReservationCard from "../components/ReservationCard";
import {
  getReservationByLink,
  updateReservationByLink,
  type ReservationLinkDto,
} from "../services/reservationService";

import "../styles/ReservationsPage.css";

export default function ReservationLinkPage() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();

  const [data, setData] = useState<ReservationLinkDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setData(await getReservationByLink(token));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : t("reservationLink.errors.load")
      );
    } finally {
      setIsLoading(false);
    }
    // The link is re-read after signing in, which is why user is a dependency.
  }, [token, user, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(status: "confirmed" | "cancelled") {
    if (!token || busy) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      setData(await updateReservationByLink(token, status));
    } catch (changeError) {
      setError(
        changeError instanceof Error
          ? changeError.message
          : t("reservationLink.errors.update")
      );
    } finally {
      setBusy(false);
    }
  }

  function renderBody() {
    // The link says nothing about who is holding it, so the page is useless
    // until somebody is signed in for the backend to check against.
    if (!user) {
      return (
        <p className="reservations-page__state">
          {t("reservationLink.signInRequired")}
        </p>
      );
    }

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

    if (!data) {
      return null;
    }

    return (
      <div className="reservations-page__list">
        <ReservationCard
          reservation={data.reservation}
          showGuest={data.can_manage}
          busy={busy}
          onConfirm={data.can_manage ? () => changeStatus("confirmed") : undefined}
          onCancel={data.can_manage ? () => changeStatus("cancelled") : undefined}
        />
      </div>
    );
  }

  return (
    <main className="reservations-page">
      <header className="reservations-page__header">
        <h1 className="reservations-page__title">
          {t("reservationLink.title")}
        </h1>

        <p className="reservations-page__subtitle">
          {data?.can_manage
            ? t("reservationLink.subtitleHost")
            : t("reservationLink.subtitleGuest")}
        </p>
      </header>

      {renderBody()}
    </main>
  );
}
