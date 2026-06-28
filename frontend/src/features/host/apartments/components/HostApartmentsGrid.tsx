import type { ApartmentDto } from "../../../apartments/services/apartmentService";

import HostApartmentCardItem from "./HostApartmentCardItem";

type Props = {
  show: boolean;
  items: ApartmentDto[];
  isHost: boolean;
  onDeleteClick: (apartment: ApartmentDto) => void;
};

export default function HostApartmentsGrid({
  show,
  items,
  isHost,
  onDeleteClick,
}: Props) {
  if (!show) {
    return null;
  }

  return (
    <div className="row g-4 host-apartments-page__grid">
      {items.map((apartment) => (
        <HostApartmentCardItem
          key={apartment.id}
          apartment={apartment}
          isHost={isHost}
          onDeleteClick={onDeleteClick}
        />
      ))}
    </div>
  );
}