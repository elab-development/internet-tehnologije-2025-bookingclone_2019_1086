import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import ReactDatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

import { useDateRange } from "../../shared/hooks/useDateRange";
import { parseApiDate, toApiDate } from "../../shared/utils/date";

const DatePicker = ReactDatePicker as unknown as React.FC<any>;

export type ApartmentSearchValues = {
  name: string;
  city: string;
  guests: string;
  checkIn: string;
  checkOut: string;
};

type Props = {
  name: string;
  city: string;
  guests: string;
  checkIn: string;
  checkOut: string;
  hasFilters: boolean;
  onSearch: (next: ApartmentSearchValues) => void;
  onReset: () => void;
};

export default function ApartmentsSearchBar({
  name,
  city,
  guests,
  checkIn,
  checkOut,
  hasFilters,
  onSearch,
  onReset,
}: Props) {
  const { t } = useTranslation();

  const [nameValue, setNameValue] = useState(name);
  const [cityValue, setCityValue] = useState(city);
  const [guestsValue, setGuestsValue] = useState(guests);

  const {
    checkInDate,
    checkOutDate,
    setRange,
    handleCheckInChange,
    handleCheckOutChange,
    getCheckInMinDate,
    getCheckOutMinDate,
  } = useDateRange(parseApiDate(checkIn), parseApiDate(checkOut));

  // Keep the inputs in step when the URL changes (back button, home search).
  useEffect(() => {
    setNameValue(name);
    setCityValue(city);
    setGuestsValue(guests);
  }, [name, city, guests]);

  useEffect(() => {
    setRange(parseApiDate(checkIn), parseApiDate(checkOut));
    // setRange only writes state, so it does not belong in the dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // A single date cannot say whether a stay fits, so both or neither is sent.
    const hasRange = Boolean(checkInDate && checkOutDate);

    onSearch({
      name: nameValue.trim(),
      city: cityValue.trim(),
      guests: guestsValue.trim(),
      checkIn: hasRange ? toApiDate(checkInDate as Date) : "",
      checkOut: hasRange ? toApiDate(checkOutDate as Date) : "",
    });
  }

  return (
    <form className="apartments-search" onSubmit={handleSubmit}>
      <div className="apartments-search__field">
        <label className="apartments-search__label" htmlFor="search-name">
          {t("apartmentsPage.search.name")}
        </label>

        <input
          id="search-name"
          className="apartments-search__input"
          value={nameValue}
          onChange={(event) => setNameValue(event.target.value)}
          placeholder={t("apartmentsPage.search.namePlaceholder")}
        />
      </div>

      <div className="apartments-search__field">
        <label className="apartments-search__label" htmlFor="search-city">
          {t("apartmentsPage.search.city")}
        </label>

        <input
          id="search-city"
          className="apartments-search__input"
          value={cityValue}
          onChange={(event) => setCityValue(event.target.value)}
          placeholder={t("apartmentsPage.search.cityPlaceholder")}
        />
      </div>

      <div className="apartments-search__field apartments-search__field--date">
        <label className="apartments-search__label">
          {t("apartmentsPage.search.checkIn")}
        </label>

        <DatePicker
          selected={checkInDate}
          onChange={handleCheckInChange}
          selectsStart
          startDate={checkInDate}
          endDate={checkOutDate}
          minDate={getCheckInMinDate()}
          dateFormat="dd.MM.yyyy"
          placeholderText="dd.mm.yyyy"
          className="apartments-search__input"
          isClearable
        />
      </div>

      <div className="apartments-search__field apartments-search__field--date">
        <label className="apartments-search__label">
          {t("apartmentsPage.search.checkOut")}
        </label>

        <DatePicker
          selected={checkOutDate}
          onChange={handleCheckOutChange}
          selectsEnd
          startDate={checkInDate}
          endDate={checkOutDate}
          minDate={getCheckOutMinDate()}
          dateFormat="dd.MM.yyyy"
          placeholderText="dd.mm.yyyy"
          className="apartments-search__input"
          isClearable
        />
      </div>

      <div className="apartments-search__field apartments-search__field--small">
        <label className="apartments-search__label" htmlFor="search-guests">
          {t("apartmentsPage.search.guests")}
        </label>

        <input
          id="search-guests"
          type="number"
          min="1"
          className="apartments-search__input"
          value={guestsValue}
          onChange={(event) => setGuestsValue(event.target.value)}
          placeholder="2"
        />
      </div>

      <div className="apartments-search__actions">
        <button type="submit" className="apartments-search__button">
          {t("apartmentsPage.search.submit")}
        </button>

        {hasFilters ? (
          <button
            type="button"
            className="apartments-search__reset"
            onClick={onReset}
          >
            {t("apartmentsPage.search.reset")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
