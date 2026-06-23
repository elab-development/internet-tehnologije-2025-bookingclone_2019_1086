import { useTranslation } from "react-i18next";

import type { ApartmentDetailsDto } from "../ApartmentDetailsPage";

type Props = {
  apartment: ApartmentDetailsDto;
};

function getLocationParts(apartment: ApartmentDetailsDto) {
  return [apartment.city, apartment.country].filter(Boolean);
}

export default function ApartmentDetailsHeader({ apartment }: Props) {
  const { t } = useTranslation();

  function getLocationText() {
    const parts = getLocationParts(apartment);

    if (parts.length > 0) {
      return parts.join(", ");
    }

    return t("apartments.details.locationNotAvailable");
  }

  return (
    <header className="apartment-details-header">
      <div className="apartment-details-header__content">
        <p className="apartment-details-header__eyebrow">
          {getLocationText()}
        </p>

        <h1 className="apartment-details-header__title">
          {apartment.title}
        </h1>

        <p className="apartment-details-header__address">
          {apartment.address}
        </p>
      </div>
    </header>
  );
}