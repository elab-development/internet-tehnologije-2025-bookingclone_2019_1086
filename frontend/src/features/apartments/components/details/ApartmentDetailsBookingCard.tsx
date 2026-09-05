import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";

import type { ApartmentDetailsDto } from "../../types/apartmentDetailsTypes";

import { useDateRange } from "../../../../shared/hooks/useDateRange";
import { useAuth } from "../../../auth/hooks/useAuth";
import { useApartmentBooking } from "../../../reservations/hooks/useApartmentBooking";
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
  const { user } = useAuth();

  const [guests, setGuests] = useState("1");

  const {
    checkInDate,
    checkOutDate,
    handleCheckInChange,
    handleCheckOutChange,
    getCheckInMinDate,
    getCheckOutMinDate,
  } = useDateRange();

  const { isDayAvailable, isBooking, error, confirmation, book } =
    useApartmentBooking(apartment.id);

  const price = getPriceValue(apartment.price_per_night);
  const nights = calculateNights(checkInDate, checkOutDate);
  const total = price * nights;

  const isOwnApartment = user !== null && user.id === apartment.user_id;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await book(checkInDate, checkOutDate, Number(guests));
  }

  function getButtonText() {
    if (isBooking) {
      return t("reservations.booking");
    }

    return t("apartments.details.booking.reserve");
  }

  function isDisabled() {
    return isBooking || !user || isOwnApartment;
  }

  function renderNotice() {
    if (!user) {
      return (
        <p className="details-booking__note details-booking__note--warning">
          {t("reservations.errors.loginRequired")}
        </p>
      );
    }

    if (isOwnApartment) {
      return (
        <p className="details-booking__note details-booking__note--warning">
          {t("reservations.errors.ownApartment")}
        </p>
      );
    }

    return null;
  }

  function renderFeedback() {
    if (error) {
      return (
        <p className="details-booking__feedback details-booking__feedback--error" role="alert">
          {error}
        </p>
      );
    }

    if (confirmation) {
      return (
        <p className="details-booking__feedback details-booking__feedback--success" role="status">
          {confirmation}
        </p>
      );
    }

    return null;
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
          filterDate={isDayAvailable}
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

      {renderFeedback()}

      <button
        type="submit"
        className="details-booking__button"
        disabled={isDisabled()}
      >
        {getButtonText()}
      </button>

      {renderNotice()}

      <p className="details-booking__note">
        {t("apartments.details.booking.note")}
      </p>
    </form>
  );
}
