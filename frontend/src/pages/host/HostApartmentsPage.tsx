import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuthUser } from "../../auth/authStorage";
import ApartmentCard from "../../components/apartments/ApartmentCard";
import * as apartmentService from "../../services/apartmentService";

function pickMainPhotoUrl(photos: apartmentService.ApartmentPhotoDto[]) {
  const main = photos.find((p) => p.is_main);
  const first = photos[0];
  return main?.image_url ?? first?.image_url ?? "https://picsum.photos/600/400";
}

export default function HostApartmentsPage() {
  const navigate = useNavigate();

  const user = getAuthUser();
  const userId = user?.id ?? null;
  const isHost = user?.role === "HOST";

  const [items, setItems] = useState<apartmentService.ApartmentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // delete modal state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteTitle, setDeleteTitle] = useState<string>("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  // message banner
  const [message, setMessage] = useState<{ type: "success" | "danger"; text: string } | null>(null);

  function closeDeleteModal() {
    if (deleteBusy) return;
    setDeleteId(null);
    setDeleteTitle("");
  }

  async function confirmDelete() {
    if (!deleteId) return;

    setDeleteBusy(true);
    setMessage(null);

    try {
      await apartmentService.deleteApartment(deleteId);
      setItems((prev) => prev.filter((x) => x.id !== deleteId));
      setMessage({ type: "success", text: "Apartment deleted successfully." });
      closeDeleteModal();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to delete apartment";
      setMessage({ type: "danger", text: msg });
    } finally {
      setDeleteBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!userId) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await apartmentService.getMyApartments({
          page_number: 1,
          page_size: 50,
        });

        const mine = res.items.filter((x) => x.user_id === userId);

        if (!cancelled) setItems(mine);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load apartments";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const showEmpty = !loading && !error && items.length === 0;

  return (
    <div className="container my-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="fw-bold mb-1">My apartments</h2>
          <div className="text-muted">Manage your listings</div>
        </div>

        {isHost ? (
          <Link to="/host/apartments/create" className="btn btn-primary">
            + Add apartment
          </Link>
        ) : null}
      </div>

      {message ? (
        <div className={`alert alert-${message.type}`} role="alert">
          {message.text}
        </div>
      ) : null}

      {loading ? <div>Loading...</div> : null}

      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : null}

      {showEmpty ? (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-4">
            <div className="fw-bold mb-1">No apartments yet</div>
            <div className="text-muted mb-3">Create your first apartment listing.</div>
            {isHost ? (
              <Link to="/host/apartments/create" className="btn btn-primary">
                Create apartment
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <div className="row g-4">
          {items.map((a) => (
            <div key={a.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <div className="position-relative">
                <ApartmentCard
                  id={a.id}
                  name={a.title}
                  country={a.country}
                  city={a.city}
                  imageUrl={pickMainPhotoUrl(a.photos)}
                />

                {isHost ? (
                  <div className="position-absolute top-0 end-0 p-2 d-flex gap-2" style={{ zIndex: 10 }}>
                    {/* EDIT */}
                    <button
                      type="button"
                      className="btn btn-light border rounded-circle p-2 shadow-sm"
                      title="Edit"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/host/apartments/${a.id}/edit`);
                      }}
                    >
                      ✏️
                    </button>

                    {/* DELETE (opens modal) */}
                    <button
                      type="button"
                      className="btn btn-light border rounded-circle p-2 shadow-sm"
                      title="Delete"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteId(a.id);
                        setDeleteTitle(a.title);
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* DELETE MODAL (Bootstrap-style, no JS required) */}
      {deleteId !== null ? (
        <div className="modal d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content rounded-4">
              <div className="modal-header">
                <h5 className="modal-title">Delete apartment</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={closeDeleteModal} />
              </div>

              <div className="modal-body">
                <div className="fw-bold mb-1">Are you sure?</div>
                <div className="text-muted">
                  This will permanently delete <span className="fw-semibold">{deleteTitle}</span> and its photos.
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={closeDeleteModal} disabled={deleteBusy}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleteBusy}>
                  {deleteBusy ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
