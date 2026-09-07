import { useTranslation } from "react-i18next";

import type { PendingPhoto } from "../../hooks/usePendingPhotos";
import { formatFileSize } from "../../hooks/usePendingPhotos";

type PendingPhotoGridProps = {
  photos: PendingPhoto[];
  busy: boolean;
  mainPhotoId: string | null;
  onRemove: (id: string) => void;
  onChooseMain: (id: string) => void;
};

export default function PendingPhotoGrid({
  photos,
  busy,
  mainPhotoId,
  onRemove,
  onChooseMain,
}: PendingPhotoGridProps) {
  const { t } = useTranslation();

  function renderEmptyState() {
    if (photos.length > 0) {
      return null;
    }

    return (
      <div className="apartment-wizard-step__empty-text apartment-wizard-step__photos-empty">
        {t("createApartment.photos.empty")}
      </div>
    );
  }

  function renderMainControl(photo: PendingPhoto) {
    if (photo.id === mainPhotoId) {
      return (
        <span className="apartment-wizard-step__photo-main-badge">
          {t("createApartment.photos.mainBadge")}
        </span>
      );
    }

    return (
      <button
        type="button"
        className="btn btn-sm btn-outline-primary"
        onClick={() => onChooseMain(photo.id)}
        disabled={busy}
      >
        {t("createApartment.photos.setMain")}
      </button>
    );
  }

  function renderPhotoCard(photo: PendingPhoto) {
    const isMain = photo.id === mainPhotoId;
    const cardClassName = isMain
      ? "apartment-wizard-step__photo-card apartment-wizard-step__photo-card--main"
      : "apartment-wizard-step__photo-card";

    return (
      <div key={photo.id} className={cardClassName}>
        <img
          src={photo.previewUrl}
          alt={photo.file.name}
          className="apartment-wizard-step__photo-image"
        />

        <div className="apartment-wizard-step__photo-body">
          <div className="apartment-wizard-step__photo-name">
            {photo.file.name}
          </div>

          <div className="apartment-wizard-step__photo-size">
            {formatFileSize(photo.file.size)}
          </div>

          <div className="apartment-wizard-step__photo-main">
            {renderMainControl(photo)}
          </div>

          <div className="apartment-wizard-step__photo-footer">
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => onRemove(photo.id)}
              disabled={busy}
            >
              {t("createApartment.actions.remove")}
            </button>

            <div className="apartment-wizard-step__photo-status">
              {t("createApartment.photos.staged")}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderPhotos() {
    if (photos.length === 0) {
      return null;
    }

    return (
      <div className="apartment-wizard-step__pending-section">
        <div className="apartment-wizard-step__selected-title">
          {t("createApartment.photos.selectedTitle")}
        </div>

        <div className="apartment-wizard-step__pending-grid">
          {photos.map((photo) => {
            return renderPhotoCard(photo);
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      {renderEmptyState()}
      {renderPhotos()}
    </>
  );
}