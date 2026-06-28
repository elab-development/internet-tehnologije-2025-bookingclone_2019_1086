import ApartmentCard from "../../../apartments/components/ApartmentCard";
import {
  getMainPhotoUrl,
  type ApartmentDto,
} from "../../../apartments/services/apartmentService";

type Props = {
  apartment: ApartmentDto;
  isHost: boolean;
  onDeleteClick: (apartment: ApartmentDto) => void;
};

export default function HostApartmentCardItem({
  apartment,
  isHost,
  onDeleteClick,
}: Props) {
  function handleDeleteClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    onDeleteClick(apartment);
  }

  function renderDeleteAction() {
    if (!isHost) {
      return null;
    }

    return (
      <div className="host-apartments-page__actions">
        <button
          type="button"
          className="btn btn-light border shadow-sm host-apartments-page__icon-button"
          title="Delete"
          onClick={handleDeleteClick}
        >
          🗑️
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

        {renderDeleteAction()}
      </div>
    </div>
  );
}