import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getHostReservations,
  getMyReservations,
  updateReservationStatus,
  type ReservationDto,
  type ReservationStatus,
} from "../services/reservationService";

export type ReservationScope = "guest" | "host";

export type ReservationFilters = {
  status: ReservationStatus | "";
  dateFrom: string;
  dateTo: string;
};

export const EMPTY_RESERVATION_FILTERS: ReservationFilters = {
  status: "",
  dateFrom: "",
  dateTo: "",
};

const PAGE_SIZE = 10;

export function useReservationList(scope: ReservationScope) {
  const { t } = useTranslation();

  const [items, setItems] = useState<ReservationDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ReservationFilters>(
    EMPTY_RESERVATION_FILTERS
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const args = {
      page_number: page,
      page_size: PAGE_SIZE,
      status: filters.status || undefined,
      date_from: filters.dateFrom || undefined,
      date_to: filters.dateTo || undefined,
    };

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
  }, [scope, page, filters, t]);

  useEffect(() => {
    load();
  }, [load]);

  // A different list starts from its own first page.
  useEffect(() => {
    setPage(1);
  }, [scope]);

  // A narrower list would otherwise keep the page number of the wider one.
  function applyFilters(next: ReservationFilters) {
    setFilters(next);
    setPage(1);
  }

  function resetFilters() {
    applyFilters(EMPTY_RESERVATION_FILTERS);
  }

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

  const hasFilters = Boolean(
    filters.status || filters.dateFrom || filters.dateTo
  );

  return {
    items,
    filters,
    hasFilters,
    applyFilters,
    resetFilters,
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
