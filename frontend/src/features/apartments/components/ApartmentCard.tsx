import type { KeyboardEvent, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { formatApartmentPrice } from "../services/apartmentService";
import {
  formatRating,
  parseRating,
  ratingWordKey,
} from "../../reviews/utils/ratingFormat";

import "./ApartmentCard.css";

type Props = {
  id: number;
  name: string;
  country: string;
  city: string;
  imageUrl: string;
  pricePerNight?: string | number;
  ratingAverage?: string | number | null;
  reviewsCount?: number;
};

export default function ApartmentCard({
  id,
  name,
  country,
  city,
  imageUrl,
  pricePerNight = 0,
  ratingAverage = null,
  reviewsCount = 0,
}: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  function openDetails() {
    navigate(`/apartments/${id}`);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter") {
      openDetails();
    }
  }

  function renderRating() {
    const score = parseRating(ratingAverage);

    if (score === null || reviewsCount === 0) {
      return (
        <div className="apartment-card__rating apartment-card__rating--empty">
          <span className="apartment-card__rating-text">
            {t("reviews.noRatingShort")}
          </span>
        </div>
      );
    }

    const wordKey = ratingWordKey(score);

    return (
      <div className="apartment-card__rating">
        <span className="apartment-card__rating-score">
          {formatRating(score)}
        </span>

        <span className="apartment-card__rating-text">
          {wordKey ? t(`reviews.words.${wordKey}`) : ""}
        </span>

        <span className="apartment-card__rating-count">
          {t("reviews.countShort", { count: reviewsCount })}
        </span>
      </div>
    );
  }

  function handleFavoriteClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    // TODO: wishlist later
  }

  return (
    <div
      className="apartment-card"
      role="button"
      tabIndex={0}
      onClick={openDetails}
      onKeyDown={handleKeyDown}
    >
      <div className="apartment-card__image-wrapper">
        <img src={imageUrl} className="apartment-card__image" alt={name} />
      </div>

      <div className="apartment-card__body">
        <h5 className="apartment-card__title">{name}</h5>

        <p className="apartment-card__location">
          {city}, {country}
        </p>

        <p className="apartment-card__price">
          {formatApartmentPrice(pricePerNight)} / night
        </p>

        {renderRating()}
      </div>
    </div>
  );
}