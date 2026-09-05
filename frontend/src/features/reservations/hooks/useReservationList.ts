import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getHostReservations,
  getMyReservations,
  updateReservationStatus,
  type ReservationDto,
} from "../services/reservationService";

export type ReservationScope = "guest" | "host";

export function useReservationList(scope: ReservationScope) {
  const { t } = useTranslation();

  const [items, setItems] = useState<ReservationDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loaded =
        scope === "host" ? await getHostReservations() : await getMyReservations();

      setItems(loaded);
    } catch (loadError) {
      if (loadError instanceof Error) {
        setError(loadError.message);
      } else {
        setError(t("reservations.errors.loadFailed"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [scope, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(
    reservation: ReservationDto,
    status: "confirmed" | "cancelled"
  ) {
    if (busyId !== null) {
      return;
    }

    setBusyId(reservation.id);
    setError(null);

    try {
      const updated = await updateReservationStatus(reservation.id, status);

      setItems((current) => {
        return current.map((item) => {
          return item.id === updated.id ? updated : item;
        });
      });
    } catch (updateError) {
      if (updateError instanceof Error) {
        setError(updateError.message);
      } else {
        setError(t("reservations.errors.updateFailed"));
      }
    } finally {
      setBusyId(null);
    }
  }

  return {
    items,
    isLoading,
    error,
    busyId,
    changeStatus,
    isEmpty: !isLoading && !error && items.length === 0,
  };
}
