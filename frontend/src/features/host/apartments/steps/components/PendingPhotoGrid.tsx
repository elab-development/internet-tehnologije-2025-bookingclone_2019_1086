import type { PendingPhoto } from "../../hooks/usePendingPhotos";
import { formatFileSize } from "../../hooks/usePendingPhotos";

type PendingPhotoGridProps = {
  photos: PendingPhoto[];
  busy: boolean;
  onRemove: (id: string) => void;
};

export default function PendingPhotoGrid({
  photos,
  busy,
  onRemove,
}: PendingPhotoGridProps) {
  function renderEmptyState() {
    if (photos.length > 0) {
      return null;
    }

    return (
      <div className="apartment-wizard-step__empty-text apartment-wizard-step__photos-empty">
        No photos selected yet.
      </div>
    );
  }

  function renderPhotoCard(photo: PendingPhoto) {
    return (
      <div key={photo.id} className="apartment-wizard-step__photo-card">
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

          <div className="apartment-wizard-step__photo-footer">
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => onRemove(photo.id)}
              disabled={busy}
            >
              Remove
            </button>

            <div className="apartment-wizard-step__photo-status">staged</div>
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
          Selected photos (not uploaded yet)
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