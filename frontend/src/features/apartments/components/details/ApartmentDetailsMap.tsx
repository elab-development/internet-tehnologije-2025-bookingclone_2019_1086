import type { ApartmentDetailsDto } from "../ApartmentDetailsPage";

type Props = {
  apartment: ApartmentDetailsDto;
};

function buildMapSrc(apartment: ApartmentDetailsDto) {
  if (apartment.latitude && apartment.longitude) {
    const latitude = Number(apartment.latitude);
    const longitude = Number(apartment.longitude);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      const delta = 0.01;
      const left = longitude - delta;
      const right = longitude + delta;
      const top = latitude + delta;
      const bottom = latitude - delta;

      return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;
    }
  }

  const queryValue = [apartment.address, apartment.city, apartment.country]
    .filter(Boolean)
    .join(", ");

  const query = encodeURIComponent(queryValue || "Belgrade");

  return `https://www.openstreetmap.org/export/embed.html?search=${query}`;
}

function getMapText(apartment: ApartmentDetailsDto) {
  if (apartment.latitude && apartment.longitude) {
    return `Coordinates: ${apartment.latitude}, ${apartment.longitude}`;
  }

  return "Using address search because coordinates are not provided.";
}

export default function ApartmentDetailsMap({ apartment }: Props) {
  return (
    <section className="apartment-details-section apartment-details-section--map">
      <h2 className="apartment-details-section__title">Location</h2>

      <div className="apartment-map">
        <iframe
          title="Apartment location"
          src={buildMapSrc(apartment)}
          className="apartment-map__frame"
          loading="lazy"
        />
      </div>

      <p className="apartment-map__text">
        {getMapText(apartment)}
      </p>
    </section>
  );
}