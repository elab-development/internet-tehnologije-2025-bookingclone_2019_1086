import { useState } from "react";

export function useDateRange(
  initialCheckIn: Date | null = null,
  initialCheckOut: Date | null = null
) {
  const [checkInDate, setCheckInDate] = useState<Date | null>(initialCheckIn);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(initialCheckOut);

  /** Used when the range comes from outside, e.g. after the URL changed. */
  function setRange(nextCheckIn: Date | null, nextCheckOut: Date | null) {
    setCheckInDate(nextCheckIn);
    setCheckOutDate(nextCheckOut);
  }

  function handleCheckInChange(date: Date | null) {
    setCheckInDate(date);

    if (!date) {
      return;
    }

    if (checkOutDate && date >= checkOutDate) {
      setCheckOutDate(null);
    }
  }

  function handleCheckOutChange(date: Date | null) {
    if (!date) {
      setCheckOutDate(null);
      return;
    }

    if (checkInDate && date <= checkInDate) {
      return;
    }

    setCheckOutDate(date);
  }

  function getCheckInMinDate() {
    return new Date();
  }

  function getCheckOutMinDate() {
    if (checkInDate) {
      return checkInDate;
    }

    return new Date();
  }

  return {
    checkInDate,
    checkOutDate,
    setRange,
    handleCheckInChange,
    handleCheckOutChange,
    getCheckInMinDate,
    getCheckOutMinDate,
  };
}