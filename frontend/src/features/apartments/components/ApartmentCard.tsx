import type { KeyboardEvent, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";

import "./ApartmentCard.css";

type Props = {
  id: number;
  name: string;
  country: string;
  city: string;
  imageUrl: string;
  pricePerNight?: string | number;
};

export default function ApartmentCard({
  id,
  name,
  country,
  city,
  imageUrl,
  pricePerNight = 0,
}: Props) {
  const navigate = useNavigate();

  function openDetails() {
    navigate(`/apartments/${id}`);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter") {
      openDetails();
    }
  }

  function handleFavoriteClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    // TODO: wishlist later
  }

  function getFormattedPrice() {
    const price = Number(pricePerNight);

    if (Number.isNaN(price)) {
      return "€0";
    }

    return `€${price.toFixed(0)}`;
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

        <button
          className="apartment-card__favorite-button"
          type="button"
          onClick={handleFavoriteClick}
          aria-label="Add to wishlist"
        >
          ❤
        </button>
      </div>

      <div className="apartment-card__body">
        <h5 className="apartment-card__title">{name}</h5>

        <p className="apartment-card__location">
          {city}, {country}
        </p>

        <p className="apartment-card__price">{getFormattedPrice()} / night</p>

        <div className="apartment-card__rating">
          <span className="apartment-card__rating-score">10</span>
          <span className="apartment-card__rating-text">Exceptional</span>
        </div>
      </div>
    </div>
  );
}