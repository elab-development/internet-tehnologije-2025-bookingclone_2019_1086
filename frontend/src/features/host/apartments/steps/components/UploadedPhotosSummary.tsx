import type { ApartmentPhotoDto } from "../../../../apartments/services/apartmentService";

type UploadedPhotosSummaryProps = {
  photos: ApartmentPhotoDto[];
};

export default function UploadedPhotosSummary({
  photos,
}: UploadedPhotosSummaryProps) {
  function hasUploadedPhotos() {
    return photos.length > 0;
  }

  if (!hasUploadedPhotos()) {
    return null;
  }

  return (
    <div className="apartment-wizard-step__uploaded-section">
      <div className="apartment-wizard-step__selected-title">
        Uploaded (backend returned)
      </div>

      <div className="apartment-wizard-step__empty-text">
        Uploaded {photos.length} photo(s).
      </div>
    </div>
  );
}