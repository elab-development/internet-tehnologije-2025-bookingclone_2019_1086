import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactDatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

import { useDateRange } from "../../shared/hooks/useDateRange";
import { toApiDate } from "../../shared/utils/date";

const DatePicker = ReactDatePicker as unknown as React.FC<any>;

export default function HomeSearchForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [location, setLocation] = useState("");
  const [guests, setGuests] = useState("");

  const {
    checkInDate,
    checkOutDate,
    handleCheckInChange,
    handleCheckOutChange,
    getCheckInMinDate,
    getCheckOutMinDate,
  } = useDateRange();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const searchParams = new URLSearchParams();

    const trimmedLocation = location.trim();

    if (trimmedLocation) {
      searchParams.set("city", trimmedLocation);
    }

    if (guests.trim()) {
      searchParams.set("guests", guests.trim());
    }

    // Only a full range can be searched, a single date says nothing about a stay.
    if (checkInDate && checkOutDate) {
      searchParams.set("check_in", toApiDate(checkInDate));
      searchParams.set("check_out", toApiDate(checkOutDate));
    }

    navigate({
      pathname: "/apartments",
      search: searchParams.toString(),
    });
  }

  return (
    <form className="home-search" onSubmit={handleSubmit}>
      <div className="home-search__field">
        <label className="home-search__label">{t("home.search.location")}</label>

        <input
          type="text"
          className="home-search__input"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder={t("home.search.locationPlaceholder")}
        />
      </div>

      <div className="home-search__field">
        <label className="home-search__label">{t("home.search.checkIn")}</label>

        <DatePicker
          selected={checkInDate}
          onChange={handleCheckInChange}
          selectsStart
          startDate={checkInDate}
          endDate={checkOutDate}
          minDate={getCheckInMinDate()}
          dateFormat="dd.MM.yyyy"
          placeholderText="dd.mm.yyyy"
          className="home-search__input"
          calendarClassName="home-calendar"
          popperClassName="home-calendar-popper"
        />
      </div>

      <div className="home-search__field">
        <label className="home-search__label">{t("home.search.checkOut")}</label>

        <DatePicker
          selected={checkOutDate}
          onChange={handleCheckOutChange}
          selectsEnd
          startDate={checkInDate}
          endDate={checkOutDate}
          minDate={getCheckOutMinDate()}
          dateFormat="dd.MM.yyyy"
          placeholderText="dd.mm.yyyy"
          className="home-search__input"
          calendarClassName="home-calendar"
          popperClassName="home-calendar-popper"
        />
      </div>

      <div className="home-search__field home-search__field--small">
        <label className="home-search__label">{t("home.search.guests")}</label>

        <input
          type="number"
          min="1"
          className="home-search__input"
          value={guests}
          onChange={(event) => setGuests(event.target.value)}
          placeholder="2"
        />
      </div>

      <button type="submit" className="home-search__button">
        {t("home.search.button")}
      </button>
    </form>
  );
}