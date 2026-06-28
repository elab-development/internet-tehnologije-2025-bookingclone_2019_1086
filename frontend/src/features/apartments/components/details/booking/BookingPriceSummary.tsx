import { useTranslation } from "react-i18next";

import { formatApartmentPrice } from "../../../services/apartmentService";

type Props = {
  pricePerNight: string | number | null | undefined;
  nights: number;
  total: number;
};

export default function BookingPriceSummary({
  pricePerNight,
  nights,
  total,
}: Props) {
  const { t } = useTranslation();

  function getNightsLabel() {
    if (nights === 1) {
      return t("apartments.details.booking.nightSingular");
    }

    return t("apartments.details.booking.nightPlural");
  }

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
          {formatApartmentPrice(pricePerNight)} x {nights} {getNightsLabel()}
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