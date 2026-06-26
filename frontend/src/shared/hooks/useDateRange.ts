import { useState } from "react";

export function useDateRange() {
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);

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
    handleCheckInChange,
    handleCheckOutChange,
    getCheckInMinDate,
    getCheckOutMinDate,
  };
}