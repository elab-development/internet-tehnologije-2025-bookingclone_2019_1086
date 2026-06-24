import type { ApartmentDetailsDto } from "../ApartmentDetailsPage";

type Props = {
  apartment: ApartmentDetailsDto;
  onShowPhotosClick: () => void;
  onShareClick: () => void;
};

export default function ApartmentDetailsHeader({
  apartment,
  onShowPhotosClick,
  onShareClick,
}: Props) {
  return (
    <header className="apartment-details-header">
      <div className="apartment-details-header__main">
        <h1 className="apartment-details-header__title">
          {apartment.title}
        </h1>
      </div>
    </header>
  );
}