import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";

import type { ApartmentDetailsDto } from "../ApartmentDetailsPage";

import { useDateRange } from "../../../../shared/hooks/useDateRange";
import { formatApartmentPrice } from "../../services/apartmentService";

import BookingDateFields from "./booking/BookingDateFields";
import BookingGuestsField from "./booking/BookingGuestsField";
import BookingPriceSummary from "./booking/BookingPriceSummary";
import { calculateNights, getPriceValue } from "./booking/bookingUtils";

import "react-datepicker/dist/react-datepicker.css";

type Props = {
  apartment: ApartmentDetailsDto;
};

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    console.log({
      apartmentId: apartment.id,
      checkInDate,
      checkOutDate,
      guests,
    });
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
        <BookingDateFields
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
          onCheckInChange={handleCheckInChange}
          onCheckOutChange={handleCheckOutChange}
          getCheckInMinDate={getCheckInMinDate}
          getCheckOutMinDate={getCheckOutMinDate}
        />

        <BookingGuestsField
          guests={guests}
          maxGuests={apartment.max_guests}
          onGuestsChange={setGuests}
        />
      </div>

      <BookingPriceSummary
        pricePerNight={apartment.price_per_night}
        nights={nights}
        total={total}
      />

      <button type="submit" className="details-booking__button">
        {t("apartments.details.booking.reserve")}
      </button>

      <p className="details-booking__note">
        {t("apartments.details.booking.note")}
      </p>
    </form>
  );
}