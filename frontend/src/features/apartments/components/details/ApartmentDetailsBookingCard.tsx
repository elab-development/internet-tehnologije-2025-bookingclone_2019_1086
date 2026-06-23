import { useState } from "react";
import { useTranslation } from "react-i18next";
import ReactDatePicker from "react-datepicker";

import type { ApartmentDetailsDto } from "../ApartmentDetailsPage";

import "react-datepicker/dist/react-datepicker.css";

const DatePicker = ReactDatePicker as unknown as React.FC<any>;

type Props = {
  apartment: ApartmentDetailsDto;
};

function formatPrice(price: string) {
  const value = Number(price);

  if (!Number.isFinite(value)) {
    return "€0";
  }

  return `€${value.toFixed(0)}`;
}

function calculateNights(checkInDate: Date | null, checkOutDate: Date | null) {
  if (!checkInDate) {
    return 0;
  }

  if (!checkOutDate) {
    return 0;
  }

  const milliseconds = checkOutDate.getTime() - checkInDate.getTime();
  const nights = Math.ceil(milliseconds / 86_400_000);

  if (nights < 1) {
    return 0;
  }

  return nights;
}

export default function ApartmentDetailsBookingCard({ apartment }: Props) {
  const { t } = useTranslation();

  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState("1");

  const price = Number(apartment.price_per_night);
  const nights = calculateNights(checkInDate, checkOutDate);
  const total = price * nights;

  function getNightsLabel() {
    if (nights === 1) {
      return t("apartments.details.booking.nightSingular");
    }

    return t("apartments.details.booking.nightPlural");
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    console.log({
      apartmentId: apartment.id,
      checkInDate,
      checkOutDate,
      guests,
    });
  }

  function renderPriceSummary() {
    if (nights === 0) {
      return (
        <div className="details-booking__summary-muted">
          {t("apartments.details.booking.selectDates")}
        </div>
      );
    }

    return (
      <div className="details-booking__summary">
        <div className="details-booking__summary-row">
          <span>
            {formatPrice(apartment.price_per_night)} x {nights}{" "}
            {getNightsLabel()}
          </span>

          <strong>€{total.toFixed(0)}</strong>
        </div>

        <div className="details-booking__summary-row details-booking__summary-row--total">
          <span>{t("apartments.details.booking.total")}</span>
          <strong>€{total.toFixed(0)}</strong>
        </div>
      </div>
    );
  }

  return (
    <form className="details-booking" onSubmit={handleSubmit}>
      <div className="details-booking__header">
        <div>
          <p className="details-booking__label">
            {t("apartments.details.booking.pricePerNight")}
          </p>

          <h2 className="details-booking__price">
            {formatPrice(apartment.price_per_night)}
          </h2>
        </div>

        <span className="details-booking__badge">
          {t("apartments.details.booking.maxGuests", {
            count: apartment.max_guests,
          })}
        </span>
      </div>

      <div className="details-booking__grid">
        <div className="details-booking__field">
          <label className="details-booking__field-label">
            {t("apartments.details.booking.checkIn")}
          </label>

          <DatePicker
            selected={checkInDate}
            onChange={handleCheckInChange}
            selectsStart
            startDate={checkInDate}
            endDate={checkOutDate}
            minDate={new Date()}
            dateFormat="dd.MM.yyyy"
            placeholderText={t("apartments.details.booking.datePlaceholder")}
            className="details-booking__input"
            calendarClassName="home-calendar"
            popperClassName="home-calendar-popper"
          />
        </div>

        <div className="details-booking__field">
          <label className="details-booking__field-label">
            {t("apartments.details.booking.checkOut")}
          </label>

          <DatePicker
            selected={checkOutDate}
            onChange={handleCheckOutChange}
            selectsEnd
            startDate={checkInDate}
            endDate={checkOutDate}
            minDate={checkInDate ?? new Date()}
            dateFormat="dd.MM.yyyy"
            placeholderText={t("apartments.details.booking.datePlaceholder")}
            className="details-booking__input"
            calendarClassName="home-calendar"
            popperClassName="home-calendar-popper"
          />
        </div>

        <div className="details-booking__field details-booking__field--full">
          <label className="details-booking__field-label">
            {t("apartments.details.booking.guests")}
          </label>

          <input
            type="number"
            min="1"
            max={apartment.max_guests}
            value={guests}
            onChange={(event) => setGuests(event.target.value)}
            className="details-booking__input"
            placeholder="2"
          />
        </div>
      </div>

      {renderPriceSummary()}

      <button type="submit" className="details-booking__button">
        {t("apartments.details.booking.reserve")}
      </button>

      <p className="details-booking__note">
        {t("apartments.details.booking.note")}
      </p>
    </form>
  );
}