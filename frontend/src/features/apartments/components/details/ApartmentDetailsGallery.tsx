import { useTranslation } from "react-i18next";
import type { ApartmentPhotoDto } from "../../services/apartmentService";

type Props = {
  title: string;
  photos: ApartmentPhotoDto[];
  activePhotoUrl: string;
  onPhotoSelect: (url: string) => void;
};

function getThumbnailClassName(photoUrl: string, activePhotoUrl: string) {
  const classes = ["apartment-gallery__thumbnail"];

  if (photoUrl === activePhotoUrl) {
    classes.push("apartment-gallery__thumbnail--active");
  }

  return classes.join(" ");
}

function getActiveImageUrl(activePhotoUrl: string, photos: ApartmentPhotoDto[]) {
  if (activePhotoUrl) {
    return activePhotoUrl;
  }

  return photos[0].image_url;
}

function getPreviewPhotos(photos: ApartmentPhotoDto[], activePhotoUrl: string) {
  const previewPhotos: ApartmentPhotoDto[] = [];

  photos.forEach((photo) => {
    if (previewPhotos.length >= 4) {
      return;
    }

    if (photo.image_url === activePhotoUrl) {
      return;
    }

    previewPhotos.push(photo);
  });

  return previewPhotos;
}

export default function ApartmentDetailsGallery({
  title,
  photos,
  activePhotoUrl,
  onPhotoSelect,
}: Props) {
  const { t } = useTranslation();

  const activeImageUrl = getActiveImageUrl(activePhotoUrl, photos);
  const previewPhotos = getPreviewPhotos(photos, activeImageUrl);

  function getPhotoAlt(index: number) {
    return t("apartments.details.gallery.photoAlt", {
      title,
      number: index + 1,
    });
  }

  return (
    <section className="apartment-gallery">
      <div className="apartment-gallery__grid">
        <button
          type="button"
          className="apartment-gallery__main"
          onClick={() => onPhotoSelect(activeImageUrl)}
        >
          <img
            src={activeImageUrl}
            alt={title}
            className="apartment-gallery__image"
          />
        </button>

        <div className="apartment-gallery__preview">
          {previewPhotos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              className="apartment-gallery__preview-item"
              onClick={() => onPhotoSelect(photo.image_url)}
            >
              <img
                src={photo.image_url}
                alt={getPhotoAlt(index)}
                className="apartment-gallery__image"
              />
            </button>
          ))}
        </div>
      </div>

      <div
        className="apartment-gallery__scroller"
        aria-label={t("apartments.details.gallery.ariaLabel")}
      >
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            className={getThumbnailClassName(photo.image_url, activeImageUrl)}
            onClick={() => onPhotoSelect(photo.image_url)}
          >
            <img
              src={photo.image_url}
              alt={getPhotoAlt(index)}
              className="apartment-gallery__thumbnail-image"
            />
          </button>
        ))}
      </div>
    </section>
  );
}