import { useState } from "react";
import { useTranslation } from "react-i18next";
import ReactDatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

const DatePicker = ReactDatePicker as unknown as React.FC<any>;

export default function HomeSearchForm() {
  const { t } = useTranslation();

  const [location, setLocation] = useState("");
  const [guests, setGuests] = useState("");

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const searchParams = {
      location,
      checkInDate,
      checkOutDate,
      guests,
    };

    console.log(searchParams);

    // Kasnije ovde povezujemo filter / query parametre.
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
          minDate={new Date()}
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
          minDate={checkInDate ?? new Date()}
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