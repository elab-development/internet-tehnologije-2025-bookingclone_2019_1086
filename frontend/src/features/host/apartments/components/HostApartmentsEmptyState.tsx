import { Link } from "react-router-dom";

type Props = {
  show: boolean;
  isHost: boolean;
};

export default function HostApartmentsEmptyState({ show, isHost }: Props) {
  if (!show) {
    return null;
  }

  function renderCreateButton() {
    if (!isHost) {
      return null;
    }

    return (
      <Link to="/host/apartments/create" className="btn btn-primary">
        Create apartment
      </Link>
    );
  }

  return (
    <div className="card shadow-sm host-apartments-page__empty-card">
      <div className="card-body p-4">
        <div className="host-apartments-page__empty-title">
          No apartments yet
        </div>

        <div className="host-apartments-page__empty-text">
          Create your first apartment listing.
        </div>

        {renderCreateButton()}
      </div>
    </div>
  );
}