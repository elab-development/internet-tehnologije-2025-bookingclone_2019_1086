import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { toApiDate } from "../../../../shared/utils/date";
import { useHostApartmentOptions } from "../../apartments/hooks/useHostApartmentOptions";
import {
  getHostEarnings,
  getHostEarningsByApartment,
  type ApartmentShareDto,
  type EarningsGroupBy,
  type EarningsPointDto,
} from "../services/statsService";
import { sumEarnings } from "../utils/statsFormat";

export type StatsFilters = {
  groupBy: EarningsGroupBy;
  dateFrom: string;
  dateTo: string;
  apartmentId: number | null;
};

export function buildDefaultFilters(): StatsFilters {
  const now = new Date();

  return {
    groupBy: "month",
    dateFrom: toApiDate(new Date(now.getFullYear(), 0, 1)),
    dateTo: toApiDate(new Date(now.getFullYear(), 11, 31)),
    apartmentId: null,
  };
}

export function useHostStats() {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<StatsFilters>(buildDefaultFilters);
  const [earnings, setEarnings] = useState<EarningsPointDto[]>([]);
  const [shares, setShares] = useState<ApartmentShareDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { options: apartmentOptions } = useHostApartmentOptions();

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = {
      group_by: filters.groupBy,
      date_from: filters.dateFrom || undefined,
      date_to: filters.dateTo || undefined,
      apartment_id: filters.apartmentId,
    };

    try {

      const [loadedEarnings, loadedShares] = await Promise.all([
        getHostEarnings(params),
        getHostEarningsByApartment(params),
      ]);

      setEarnings(loadedEarnings);
      setShares(loadedShares);
    } catch (loadError) {
      if (loadError instanceof Error) {
        setError(loadError.message);
      } else {
        setError(t("stats.errors.loadFailed"));
      }

      setEarnings([]);
      setShares([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, t]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => sumEarnings(earnings), [earnings]);

  function applyFilters(next: StatsFilters) {
    setFilters(next);
  }

  function resetFilters() {
    setFilters(buildDefaultFilters());
  }

  return {
    filters,
    apartmentOptions,
    earnings,
    shares,
    totals,
    isLoading,
    error,
    applyFilters,
    resetFilters,
    isEmpty: !isLoading && !error && totals.reservations === 0,
  };
}
