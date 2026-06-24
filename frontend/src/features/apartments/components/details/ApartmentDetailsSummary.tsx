import { useTranslation } from "react-i18next";

import type { ApartmentDetailsDto } from "../ApartmentDetailsPage";

type Props = {
  apartment: ApartmentDetailsDto;
};

function getLocationParts(apartment: ApartmentDetailsDto) {
  return [apartment.address, apartment.city, apartment.country].filter(Boolean);
}

export default function ApartmentDetailsSummary({ apartment }: Props) {
  const { t } = useTranslation();

  function getLocationText() {
    const parts = getLocationParts(apartment);

    if (parts.length > 0) {
      return parts.join(", ");
    }

    return t("apartments.details.locationNotAvailable");
  }

  return (
    <section className="apartment-details-summary">
      <p className="apartment-details-summary__location">
        {getLocationText()}
      </p>

      <div className="apartment-details-summary__badges">
        <span className="apartment-details-summary__badge">
          {apartment.max_guests} {t("apartments.details.summary.guests")}
        </span>

        <span className="apartment-details-summary__badge">
          {apartment.reviews_count} {t("apartments.details.summary.reviews")}
        </span>
      </div>
    </section>
  );
}