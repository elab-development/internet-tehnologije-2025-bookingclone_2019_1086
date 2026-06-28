import type { MouseEvent } from "react";

import ApartmentCard from "../../../apartments/components/ApartmentCard";
import {
  getMainPhotoUrl,
  type ApartmentDto,
} from "../../../apartments/services/apartmentService";

type Props = {
  apartment: ApartmentDto;
  isHost: boolean;
  deleteBusyId: number | null;
  onDeleteClick: (apartment: ApartmentDto) => void;
};

function isApartmentDeleting(
  apartment: ApartmentDto,
  deleteBusyId: number | null
) {
  if (deleteBusyId === null) {
    return false;
  }

  return deleteBusyId === apartment.id;
}

function getDeleteButtonText(
  apartment: ApartmentDto,
  deleteBusyId: number | null
) {
  if (isApartmentDeleting(apartment, deleteBusyId)) {
    return "Deleting...";
  }

  return "🗑️";
}

export default function HostApartmentCardItem({
  apartment,
  isHost,
  deleteBusyId,
  onDeleteClick,
}: Props) {
  function handleDeleteClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    onDeleteClick(apartment);
  }

  function renderDeleteButton() {
    if (!isHost) {
      return null;
    }

    return (
      <div className="host-apartments-page__actions">
        <button
          type="button"
          className="btn btn-light border shadow-sm host-apartments-page__icon-button"
          title="Delete"
          disabled={isApartmentDeleting(apartment, deleteBusyId)}
          onClick={handleDeleteClick}
        >
          {getDeleteButtonText(apartment, deleteBusyId)}
        </button>
      </div>
    );
  }

  return (
    <div className="col-12 col-sm-6 col-md-4 col-lg-3">
      <div className="host-apartments-page__card-wrapper">
        <ApartmentCard
          id={apartment.id}
          name={apartment.title}
          country={apartment.country}
          city={apartment.city}
          imageUrl={getMainPhotoUrl(apartment)}
          pricePerNight={apartment.price_per_night}
        />

        {renderDeleteButton()}
      </div>
    </div>
  );
}