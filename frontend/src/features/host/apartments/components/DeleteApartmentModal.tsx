type Props = {
  open: boolean;
  apartmentTitle: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function getDeleteButtonText(busy: boolean) {
  if (busy) {
    return "Deleting...";
  }

  return "Delete";
}

export default function DeleteApartmentModal({
  open,
  apartmentTitle,
  busy,
  onClose,
  onConfirm,
}: Props) {
  if (!open) {
    return null;
  }

  return (
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
              onClick={onClose}
            />
          </div>

          <div className="modal-body">
            <div className="host-apartments-page__delete-title">
              Are you sure?
            </div>

            <div className="host-apartments-page__delete-text">
              This will permanently delete{" "}
              <span className="host-apartments-page__delete-name">
                {apartmentTitle}
              </span>{" "}
              and its photos.
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-danger"
              onClick={onConfirm}
              disabled={busy}
            >
              {getDeleteButtonText(busy)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}