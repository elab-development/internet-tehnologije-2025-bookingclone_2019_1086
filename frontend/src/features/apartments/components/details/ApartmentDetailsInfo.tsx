import { useTranslation } from "react-i18next";

import type { ApartmentTagDto } from "../../services/apartmentService";
import TagIcon from "../../../tags/components/TagIcon";

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

function getTagName(tag: ApartmentTagDto, fallback: string) {
  if (tag.name) {
    return tag.name;
  }

  return fallback;
}

export default function ApartmentDetailsInfo({ description, tags }: Props) {
  const { t } = useTranslation();

  function renderAmenities() {
    if (tags.length === 0) {
      return (
        <p className="apartment-details-section__empty">
          {t("apartments.details.info.noFacilities")}
        </p>
      );
    }

    return (
      <div className="apartment-amenities">
        {tags.map((tag, index) => {
          const name = getTagName(tag, t("apartments.details.info.facility"));

          return (
            <div
              key={getTagKey(tag, index)}
              className="apartment-amenities__item"
            >
              <TagIcon
                svg={tag.svg_icon}
                label={name}
                className="apartment-amenities__icon"
                size={20}
              />

              <span>{name}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <section className="apartment-details-section">
        <h2 className="apartment-details-section__title">
          {t("apartments.details.info.description")}
        </h2>

        <p className="apartment-details-section__text">{description}</p>
      </section>

      <section className="apartment-details-section">
        <h2 className="apartment-details-section__title">
          {t("apartments.details.info.facilities")}
        </h2>

        {renderAmenities()}
      </section>
    </>
  );
}