import React, { useEffect, useState } from "react";
import ApartmentCard from "../../components/apartments/ApartmentCard";
import * as apartmentService from "../../services/apartmentService";

function pickMainPhotoUrl(photos: apartmentService.ApartmentPhotoDto[]) {
  const main = photos.find((p) => p.is_main);
  const first = photos[0];
  const raw = main?.image_url ?? first?.image_url;
  if (!raw) return "https://picsum.photos/600/400";

  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  return `http://localhost:8000${raw}`;
}

export default function ApartmentList() {
  const [items, setItems] = useState<apartmentService.ApartmentDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await apartmentService.getApartments({
          page_number: 1,
          page_size: 12,
        });

        if (!cancelled) setItems(res.items);
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
  }, []);

  return (
    <div className="container my-4">
      <h3 className="fw-bold mb-3">Apartments</h3>

      {loading ? <div>Loading...</div> : null}

      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="row g-4">
          {items.map((a) => (
            <div key={a.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <ApartmentCard
                id={a.id}
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