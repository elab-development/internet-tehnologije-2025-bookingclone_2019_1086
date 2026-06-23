import type { ApartmentTagDto } from "../../services/apartmentService";

type Props = {
  description: string;
  tags: ApartmentTagDto[];
};

function getTagKey(tag: ApartmentTagDto, index: number) {
  if (tag.id !== undefined) {
    return String(tag.id);
  }

  if (tag.name) {
    return tag.name;
  }

  return String(index);
}

function getTagName(tag: ApartmentTagDto) {
  if (tag.name) {
    return tag.name;
  }

  return "Amenity";
}

function renderAmenities(tags: ApartmentTagDto[]) {
  if (tags.length === 0) {
    return (
      <p className="apartment-details-section__empty">
        No facilities added.
      </p>
    );
  }

  return (
    <div className="apartment-amenities">
      {tags.map((tag, index) => (
        <div key={getTagKey(tag, index)} className="apartment-amenities__item">
          <span className="apartment-amenities__icon">✓</span>
          <span>{getTagName(tag)}</span>
        </div>
      ))}
    </div>
  );
}

export default function ApartmentDetailsInfo({ description, tags }: Props) {
  return (
    <>
      <section className="apartment-details-section">
        <h2 className="apartment-details-section__title">Description</h2>

        <p className="apartment-details-section__text">
          {description}
        </p>
      </section>

      <section className="apartment-details-section">
        <h2 className="apartment-details-section__title">Facilities</h2>

        {renderAmenities(tags)}
      </section>
    </>
  );
}