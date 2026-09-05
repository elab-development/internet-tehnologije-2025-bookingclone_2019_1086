import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  createReservation,
  getRentedDays,
  toApiDate,
} from "../services/reservationService";

/** Months around the current one that we preload occupied days for. */
const MONTHS_AHEAD = 6;

function addMonths(value: Date, count: number) {
  return new Date(value.getFullYear(), value.getMonth() + count, 1);
}

export function useApartmentBooking(apartmentId: number) {
  const { t } = useTranslation();

  const [rentedDays, setRentedDays] = useState<Set<string>>(new Set());
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const loadRentedDays = useCallback(async () => {
    if (!Number.isFinite(apartmentId)) {
      return;
    }

    const today = new Date();

    const responses = await Promise.all(
      Array.from({ length: MONTHS_AHEAD }, (_, index) => {
        const month = addMonths(today, index);

        return getRentedDays(
          apartmentId,
          month.getFullYear(),
          month.getMonth() + 1
        ).catch(() => []);
      })
    );

    const taken = new Set<string>();

    responses.flat().forEach((day) => {
      if (day.rented) {
        taken.add(day.date);
      }
    });

    setRentedDays(taken);
  }, [apartmentId]);

  useEffect(() => {
    loadRentedDays();
  }, [loadRentedDays]);

  function isDayAvailable(day: Date) {
    return !rentedDays.has(toApiDate(day));
  }

  /** A stay is only valid when every night in it is free. */
  function hasTakenNight(checkIn: Date, checkOut: Date) {
    const cursor = new Date(checkIn);

    while (cursor < checkOut) {
      if (rentedDays.has(toApiDate(cursor))) {
        return true;
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    return false;
  }

  async function book(
    checkIn: Date | null,
    checkOut: Date | null,
    guests: number
  ) {
    setError(null);
    setConfirmation(null);

    if (!checkIn || !checkOut) {
      setError(t("reservations.errors.pickDates"));
      return false;
    }

    if (hasTakenNight(checkIn, checkOut)) {
      setError(t("reservations.errors.datesTaken"));
      return false;
    }

    setIsBooking(true);

    try {
      await createReservation({
        apartment_id: apartmentId,
        check_in: toApiDate(checkIn),
        check_out: toApiDate(checkOut),
        guests_count: guests,
      });

      setConfirmation(t("reservations.created"));
      await loadRentedDays();

      return true;
    } catch (bookingError) {
      if (bookingError instanceof Error) {
        setError(bookingError.message);
        return false;
      }

      setError(t("reservations.errors.createFailed"));
      return false;
    } finally {
      setIsBooking(false);
    }
  }

  return {
    isDayAvailable,
    isBooking,
    error,
    confirmation,
    book,
  };
}
