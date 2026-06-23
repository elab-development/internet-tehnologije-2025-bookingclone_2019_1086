import type { ApartmentPhotoDto } from "../../services/apartmentService";

type Props = {
  title: string;
  photos: ApartmentPhotoDto[];
  activePhotoUrl: string;
  onPhotoSelect: (url: string) => void;
};

function getPhotoAlt(title: string, index: number) {
  return `${title} photo ${index + 1}`;
}

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
  return (
    <section className="apartment-gallery">
      <div className="apartment-gallery__main">
        <img
          src={getActiveImageUrl(activePhotoUrl, photos)}
          alt={title}
          className="apartment-gallery__main-image"
        />
      </div>

      <div className="apartment-gallery__scroller" aria-label="Apartment photos">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            className={getThumbnailClassName(photo.image_url, activePhotoUrl)}
            onClick={() => onPhotoSelect(photo.image_url)}
          >
            <img
              src={photo.image_url}
              alt={getPhotoAlt(title, index)}
              className="apartment-gallery__thumbnail-image"
            />
          </button>
        ))}
      </div>
    </section>
  );
}