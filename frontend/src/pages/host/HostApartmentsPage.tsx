import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAuthUser } from "../../auth/authStorage";
import ApartmentCard from "../../components/apartments/ApartmentCard";
import * as apartmentService from "../../services/apartmentService";

function pickMainPhotoUrl(photos: apartmentService.ApartmentPhotoDto[]) {
  const main = photos.find((p) => p.is_main);
  const first = photos[0];
  return main?.image_url ?? first?.image_url ?? "https://picsum.photos/600/400";
}

export default function HostApartmentsPage() {
  // read current user
  const user = getAuthUser();
  const userId = user?.id ?? null;
  const isHost = user?.role === "HOST";

  const [items, setItems] = useState<apartmentService.ApartmentDto[]>([]);
  const [loading, setLoading] = useState(false); // ✅ start false = less flicker
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // if no user, don’t fetch
      if (!userId) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await apartmentService.getApartments({
          page_number: 1,
          page_size: 50,
        });

        const mine = res.items.filter((x) => x.user_id === userId);

        if (!cancelled) {
          setItems(mine);
        }
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
  }, [userId]); // ✅ primitive dependency (no object ref flicker)

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
            <div className="text-muted mb-3">
              Create your first apartment listing.
            </div>
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
              <ApartmentCard
                id = {a.id}
                name={a.title}
                country={a.country}
                city={a.city}
                imageUrl={pickMainPhotoUrl(a.photos)}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
