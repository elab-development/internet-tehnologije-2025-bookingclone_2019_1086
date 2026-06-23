import { useTranslation } from "react-i18next";

import type { ApartmentDetailsDto } from "../ApartmentDetailsPage";

type Props = {
  apartment: ApartmentDetailsDto;
};

export default function ApartmentDetailsSummary({ apartment }: Props) {
  const { t } = useTranslation();

  function getStatusLabel(status: string) {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === "active") {
      return t("apartments.details.status.active");
    }

    if (normalizedStatus === "inactive") {
      return t("apartments.details.status.inactive");
    }

    if (normalizedStatus === "pending") {
      return t("apartments.details.status.pending");
    }

    return status;
  }

  return (
    <section className="apartment-details-summary">
      <div className="apartment-details-summary__item">
        <strong>{apartment.max_guests}</strong>
        <span>{t("apartments.details.summary.guests")}</span>
      </div>

      <div className="apartment-details-summary__item">
        <strong>{apartment.reviews_count}</strong>
        <span>{t("apartments.details.summary.reviews")}</span>
      </div>

      <div className="apartment-details-summary__item">
        <strong>{getStatusLabel(apartment.status)}</strong>
        <span>{t("apartments.details.summary.status")}</span>
      </div>
    </section>
  );
}