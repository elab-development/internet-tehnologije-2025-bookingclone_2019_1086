import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getHostReservations,
  getMyReservations,
  updateReservationStatus,
  type ReservationDto,
} from "../services/reservationService";

export type ReservationScope = "guest" | "host";

const PAGE_SIZE = 10;

export function useReservationList(scope: ReservationScope) {
  const { t } = useTranslation();

  const [items, setItems] = useState<ReservationDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const args = { page_number: page, page_size: PAGE_SIZE };

    try {
      const loaded =
        scope === "host"
          ? await getHostReservations(args)
          : await getMyReservations(args);

      setItems(loaded.items);
      setTotal(loaded.total);
    } catch (loadError) {
      if (loadError instanceof Error) {
        setError(loadError.message);
      } else {
        setError(t("reservations.errors.loadFailed"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [scope, page, t]);

  useEffect(() => {
    load();
  }, [load]);

  // A different list starts from its own first page.
  useEffect(() => {
    setPage(1);
  }, [scope]);

  function goToPage(nextPage: number) {
    setPage(nextPage);
  }

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
    page,
    pageSize: PAGE_SIZE,
    total,
    isLoading,
    error,
    busyId,
    changeStatus,
    goToPage,
    isEmpty: !isLoading && !error && items.length === 0,
  };
}
