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

export default function ApartmentDetailsGallery({
  title,
  photos,
  activePhotoUrl,
  onPhotoSelect,
}: Props) {
  const { t } = useTranslation();

  function getPhotoAlt(index: number) {
    return t("apartments.details.gallery.photoAlt", {
      title,
      number: index + 1,
    });
  }

  return (
    <section className="apartment-gallery">
      <div className="apartment-gallery__main">
        <img
          src={getActiveImageUrl(activePhotoUrl, photos)}
          alt={title}
          className="apartment-gallery__main-image"
        />
      </div>

      <div
        className="apartment-gallery__scroller"
        aria-label={t("apartments.details.gallery.ariaLabel")}
      >
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            className={getThumbnailClassName(photo.image_url, activePhotoUrl)}
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