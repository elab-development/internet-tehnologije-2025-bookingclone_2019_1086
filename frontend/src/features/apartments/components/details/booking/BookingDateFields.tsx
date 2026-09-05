import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import ReactDatePicker from "react-datepicker";

const DatePicker = ReactDatePicker as unknown as ComponentType<any>;

type Props = {
  checkInDate: Date | null;
  checkOutDate: Date | null;
  onCheckInChange: (date: Date | null) => void;
  onCheckOutChange: (date: Date | null) => void;
  getCheckInMinDate: () => Date;
  getCheckOutMinDate: () => Date;
  filterDate?: (date: Date) => boolean;
};

export default function BookingDateFields({
  checkInDate,
  checkOutDate,
  onCheckInChange,
  onCheckOutChange,
  getCheckInMinDate,
  getCheckOutMinDate,
  filterDate,
}: Props) {
  const { t } = useTranslation();

  return (
    <>
      <div className="details-booking__field">
        <label className="details-booking__field-label">
          {t("apartments.details.booking.checkIn")}
        </label>

        <DatePicker
          selected={checkInDate}
          onChange={onCheckInChange}
          selectsStart
          startDate={checkInDate}
          endDate={checkOutDate}
          minDate={getCheckInMinDate()}
          filterDate={filterDate}
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
          onChange={onCheckOutChange}
          selectsEnd
          startDate={checkInDate}
          endDate={checkOutDate}
          minDate={getCheckOutMinDate()}
          filterDate={filterDate}
          dateFormat="dd.MM.yyyy"
          placeholderText={t("apartments.details.booking.datePlaceholder")}
          className="details-booking__input"
          calendarClassName="home-calendar"
          popperClassName="home-calendar-popper"
        />
      </div>
    </>
  );
}