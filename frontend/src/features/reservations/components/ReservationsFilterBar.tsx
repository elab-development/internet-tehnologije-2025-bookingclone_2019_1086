import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import ReactDatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

import { parseApiDate, toApiDate } from "../../../shared/utils/date";
import type { ApartmentOption } from "../../host/apartments/hooks/useHostApartmentOptions";
import type { ReservationFilters } from "../hooks/useReservationList";
import type { ReservationStatus } from "../services/reservationService";

const DatePicker = ReactDatePicker as unknown as React.FC<any>;

const STATUSES: ReservationStatus[] = ["pending", "confirmed", "cancelled"];

type Props = {
  filters: ReservationFilters;
  apartmentOptions: ApartmentOption[];
  hasFilters: boolean;
  onApply: (next: ReservationFilters) => void;
  onReset: () => void;
};

export default function ReservationsFilterBar({
  filters,
  apartmentOptions,
  hasFilters,
  onApply,
  onReset,
}: Props) {
  const { t } = useTranslation();

  const [status, setStatus] = useState(filters.status);
  const [dateFrom, setDateFrom] = useState(parseApiDate(filters.dateFrom));
  const [dateTo, setDateTo] = useState(parseApiDate(filters.dateTo));
  const [apartmentId, setApartmentId] = useState(filters.apartmentId);

  useEffect(() => {
    setStatus(filters.status);
    setDateFrom(parseApiDate(filters.dateFrom));
    setDateTo(parseApiDate(filters.dateTo));
    setApartmentId(filters.apartmentId);
  }, [filters]);

  function handleFromChange(date: Date | null) {
    setDateFrom(date);

    if (date && dateTo && date > dateTo) {
      setDateTo(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onApply({
      status,
      dateFrom: dateFrom ? toApiDate(dateFrom) : "",
      dateTo: dateTo ? toApiDate(dateTo) : "",
      apartmentId,
    });
  }

  function renderApartmentField() {
    if (apartmentOptions.length === 0) {
      return null;
    }

    return (
      <div className="reservations-filters__field reservations-filters__field--wide">
        <label
          className="reservations-filters__label"
          htmlFor="filter-apartment"
        >
          {t("reservations.filters.apartment")}
        </label>

        <select
          id="filter-apartment"
          className="reservations-filters__input"
          value={apartmentId ?? ""}
          onChange={(event) =>
            setApartmentId(event.target.value ? Number(event.target.value) : null)
          }
        >
          <option value="">{t("reservations.filters.apartmentAll")}</option>

          {apartmentOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <form className="reservations-filters" onSubmit={handleSubmit}>
      <div className="reservations-filters__field">
        <label className="reservations-filters__label" htmlFor="filter-status">
          {t("reservations.filters.status")}
        </label>

        <select
          id="filter-status"
          className="reservations-filters__input"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as ReservationStatus | "")
          }
        >
          <option value="">{t("reservations.filters.statusAll")}</option>

          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {t(`reservations.status.${value}`)}
            </option>
          ))}
        </select>
      </div>

      {renderApartmentField()}

      <div className="reservations-filters__field">
        <label className="reservations-filters__label">
          {t("reservations.filters.from")}
        </label>

        <DatePicker
          selected={dateFrom}
          onChange={handleFromChange}
          selectsStart
          startDate={dateFrom}
          endDate={dateTo}
          dateFormat="dd.MM.yyyy"
          placeholderText="dd.mm.yyyy"
          className="reservations-filters__input"
          isClearable
        />
      </div>

      <div className="reservations-filters__field">
        <label className="reservations-filters__label">
          {t("reservations.filters.to")}
        </label>

        <DatePicker
          selected={dateTo}
          onChange={setDateTo}
          selectsEnd
          startDate={dateFrom}
          endDate={dateTo}
          minDate={dateFrom ?? undefined}
          dateFormat="dd.MM.yyyy"
          placeholderText="dd.mm.yyyy"
          className="reservations-filters__input"
          isClearable
        />
      </div>

      <div className="reservations-filters__actions">
        <button type="submit" className="reservations-filters__button">
          {t("reservations.filters.apply")}
        </button>

        {hasFilters ? (
          <button
            type="button"
            className="reservations-filters__reset"
            onClick={onReset}
          >
            {t("reservations.filters.reset")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
