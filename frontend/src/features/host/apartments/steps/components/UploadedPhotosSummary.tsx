import { useTranslation } from "react-i18next";

import type { ApartmentPhotoDto } from "../../../../apartments/services/apartmentService";

type UploadedPhotosSummaryProps = {
  photos: ApartmentPhotoDto[];
};

export default function UploadedPhotosSummary({
  photos,
}: UploadedPhotosSummaryProps) {
  const { t } = useTranslation();

  function hasUploadedPhotos() {
    return photos.length > 0;
  }

  if (!hasUploadedPhotos()) {
    return null;
  }

  return (
    <div className="apartment-wizard-step__uploaded-section">
      <div className="apartment-wizard-step__selected-title">
        {t("createApartment.photos.uploadedTitle")}
      </div>

      <div className="apartment-wizard-step__empty-text">
        {t("createApartment.photos.uploadedCount", {
          count: photos.length,
        })}
      </div>
    </div>
  );
}