import { useState } from "react";
import type { ComponentType, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import ReactDatePicker from "react-datepicker";

import type { ApartmentDetailsDto } from "../ApartmentDetailsPage";

import { useDateRange } from "../../../../shared/hooks/useDateRange";
import { formatApartmentPrice } from "../../services/apartmentService";

import "react-datepicker/dist/react-datepicker.css";

const DatePicker = ReactDatePicker as unknown as ComponentType<any>;

type Props = {
  apartment: ApartmentDetailsDto;
};

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

function getPriceValue(price: string | number | null | undefined) {
  const value = Number(price);

  if (!Number.isFinite(value)) {
    return 0;
  }

  return value;
}

export default function ApartmentDetailsBookingCard({ apartment }: Props) {
  const { t } = useTranslation();

  const [guests, setGuests] = useState("1");

  const {
    checkInDate,
    checkOutDate,
    handleCheckInChange,
    handleCheckOutChange,
    getCheckInMinDate,
    getCheckOutMinDate,
  } = useDateRange();

  const price = getPriceValue(apartment.price_per_night);
  const nights = calculateNights(checkInDate, checkOutDate);
  const total = price * nights;

  function getNightsLabel() {
    if (nights === 1) {
      return t("apartments.details.booking.nightSingular");
    }

    return t("apartments.details.booking.nightPlural");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
            {formatApartmentPrice(apartment.price_per_night)} x {nights}{" "}
            {getNightsLabel()}
          </span>

          <strong>{formatApartmentPrice(total)}</strong>
        </div>

        <div className="details-booking__summary-row details-booking__summary-row--total">
          <span>{t("apartments.details.booking.total")}</span>
          <strong>{formatApartmentPrice(total)}</strong>
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
            {formatApartmentPrice(apartment.price_per_night)}
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
            minDate={getCheckInMinDate()}
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
            minDate={getCheckOutMinDate()}
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