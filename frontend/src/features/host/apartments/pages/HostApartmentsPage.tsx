import { Link } from "react-router-dom";

import ApartmentCard from "../../../apartments/components/ApartmentCard";
import { getMainPhotoUrl } from "../../../apartments/services/apartmentService";
import { useHostApartments } from "../hooks/useHostApartments";

import "../styles/HostApartmentsPage.css";

export default function HostApartmentsPage() {
  const {
    items,
    loading,
    error,
    message,
    isHost,
    hasItems,
    showEmpty,
    deleteBusy,
    deleteModal,
    isDeleteModalOpen,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
  } = useHostApartments();

  function getMessageClassName() {
    if (!message) {
      return "alert";
    }

    if (message.type === "success") {
      return "alert alert-success";
    }

    return "alert alert-danger";
  }

  function getDeleteButtonText() {
    if (deleteBusy) {
      return "Deleting...";
    }

    return "Delete";
  }

  return (
    <div className="container my-4 host-apartments-page">
      <div className="host-apartments-page__header">
        <div>
          <h2 className="host-apartments-page__title">My apartments</h2>
          <div className="host-apartments-page__subtitle">
            Manage your listings
          </div>
        </div>

        {isHost && (
          <Link to="/host/apartments/create" className="btn btn-primary">
            + Add apartment
          </Link>
        )}
      </div>

      {message && (
        <div className={getMessageClassName()} role="alert">
          {message.text}
        </div>
      )}

      {loading && <div>Loading...</div>}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {showEmpty && (
        <div className="card shadow-sm host-apartments-page__empty-card">
          <div className="card-body p-4">
            <div className="host-apartments-page__empty-title">
              No apartments yet
            </div>

            <div className="host-apartments-page__empty-text">
              Create your first apartment listing.
            </div>

            {isHost && (
              <Link to="/host/apartments/create" className="btn btn-primary">
                Create apartment
              </Link>
            )}
          </div>
        </div>
      )}

      {hasItems && !loading && !error && (
        <div className="row g-4 host-apartments-page__grid">
          {items.map((apartment) => (
            <div
              key={apartment.id}
              className="col-12 col-sm-6 col-md-4 col-lg-3"
            >
              <div className="host-apartments-page__card-wrapper">
                <ApartmentCard
                  id={apartment.id}
                  name={apartment.title}
                  country={apartment.country}
                  city={apartment.city}
                  imageUrl={getMainPhotoUrl(apartment)}
                  pricePerNight={apartment.price_per_night}
                />

                {isHost && (
                  <div className="host-apartments-page__actions">
                    <button
                      type="button"
                      className="btn btn-light border shadow-sm host-apartments-page__icon-button"
                      title="Delete"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        openDeleteModal(apartment);
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isDeleteModalOpen && (
        <div
          className="modal host-apartments-page__modal-backdrop"
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content host-apartments-page__modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete apartment</h5>

                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={closeDeleteModal}
                />
              </div>

              <div className="modal-body">
                <div className="host-apartments-page__delete-title">
                  Are you sure?
                </div>

                <div className="host-apartments-page__delete-text">
                  This will permanently delete{" "}
                  <span className="host-apartments-page__delete-name">
                    {deleteModal.apartmentTitle}
                  </span>{" "}
                  and its photos.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeDeleteModal}
                  disabled={deleteBusy}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDelete}
                  disabled={deleteBusy}
                >
                  {getDeleteButtonText()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}