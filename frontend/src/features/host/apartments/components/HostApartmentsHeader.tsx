import { Link } from "react-router-dom";

type Props = {
  isHost: boolean;
};

export default function HostApartmentsHeader({ isHost }: Props) {
  function renderCreateButton() {
    if (!isHost) {
      return null;
    }

    return (
      <Link to="/host/apartments/create" className="btn btn-primary">
        + Add apartment
      </Link>
    );
  }

  return (
    <div className="host-apartments-page__header">
      <div>
        <h2 className="host-apartments-page__title">My apartments</h2>

        <div className="host-apartments-page__subtitle">
          Manage your listings
        </div>
      </div>

      {renderCreateButton()}
    </div>
  );
}