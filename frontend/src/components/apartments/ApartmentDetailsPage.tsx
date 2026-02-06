import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import * as apartmentService from "../../services/apartmentService";

function pickMainPhoto(photos: apartmentService.ApartmentPhotoDto[]) {
  const main = photos.find((p) => p.is_main);
  return main ?? photos[0] ?? null;
}


function buildMapSrc(args: {
  lat?: string | null;
  lon?: string | null;
  address?: string;
  city?: string;
  country?: string;
}) {
  const { lat, lon, address, city, country } = args;

  if (lat && lon) {
    const la = Number(lat);
    const lo = Number(lon);

    if (Number.isFinite(la) && Number.isFinite(lo)) {
      const delta = 0.01; 
      const left = lo - delta;
      const right = lo + delta;
      const top = la + delta;
      const bottom = la - delta;

      return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${la}%2C${lo}`;
    }
  }

  const q = [address, city, country].filter(Boolean).join(", ");
  const query = encodeURIComponent(q || "Belgrade");

  return `https://www.openstreetmap.org/export/embed.html?search=${query}`;
}

export default function ApartmentDetailsPage() {
  const params = useParams();
  const apartmentId = Number(params.id);

  const [item, setItem] = useState<apartmentService.ApartmentDto | null>(null);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        if (!Number.isFinite(apartmentId)) {
          throw new Error("Invalid apartment id.");
        }

        const a = await apartmentService.getApartmentById(apartmentId);

        if (cancelled) return;

        setItem(a);

        const main = pickMainPhoto(a.photos);
        setActivePhotoUrl(main?.image_url ?? "https://picsum.photos/1200/800");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load apartment";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [apartmentId]);

  const mapSrc = useMemo(() => {
    if (!item) return "";
    return buildMapSrc({
      lat: item.latitude,
      lon: item.longitude,
      address: item.address,
      city: item.city,
      country: item.country,
    });
  }, [item]);

  if (loading) {
    return (
      <div className="container my-4">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container my-4">
        <div className="alert alert-danger" role="alert">
          {error ?? "Not found"}
        </div>
      </div>
    );
  }

  const location = [item.city, item.country].filter(Boolean).join(", ");
  const tags = (item as any).tags ?? [];

  const photos =
    item.photos.length > 0
      ? item.photos
      : [{ id: 0, image_url: "https://picsum.photos/600/400", is_main: true }];

  return (
    <div className="container my-4" style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-start gap-3 mb-3">
        <div className="flex-grow-1">
          <h2 className="fw-bold mb-1">{item.title}</h2>
          <div className="text-muted">
            {location} · {item.address}
          </div>
        </div>

        <div className="text-end">
          <div className="fw-semibold">Price / night</div>
          <div className="fs-4 fw-bold">{item.price_per_night} €</div>
          <div className="text-muted small">Max guests: {item.max_guests}</div>
        </div>
      </div>

      {/* Gallery */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-12 col-lg-8">
              <img
                src={activePhotoUrl}
                alt="apartment"
                className="w-100 rounded-4"
                style={{ height: 420, objectFit: "cover" }}
              />
            </div>

            <div className="col-12 col-lg-4">
              <div className="row g-2">
                {photos.slice(0, 6).map((p) => (
                  <div key={p.id} className="col-4 col-lg-6">
                    <button
                      type="button"
                      className="btn p-0 w-100"
                      onClick={() => setActivePhotoUrl(p.image_url)}
                      style={{ border: "none" }}
                    >
                      <img
                        src={p.image_url}
                        alt={`thumb-${p.id}`}
                        className="w-100 rounded-3"
                        style={{ height: 90, objectFit: "cover" }}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="text-muted small mt-2">
                Click a thumbnail to view.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="row g-4">
        {/* Left */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-2">Description</h5>
              <p className="text-muted mb-0" style={{ whiteSpace: "pre-wrap" }}>
                {item.description}
              </p>
            </div>
          </div>

          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">Facilities</h5>

              {Array.isArray(tags) && tags.length > 0 ? (
                <div className="d-flex flex-wrap gap-2">
                  {tags.map((t: any) => (
                    <span
                      key={t.id ?? t.name}
                      className="badge text-bg-light border rounded-pill px-3 py-2"
                    >
                      {t.name ?? String(t)}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-muted">No tags/facilities.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-3">
              <h5 className="fw-bold px-2 pt-2 mb-2">Location</h5>

              <div className="rounded-4 overflow-hidden">
                <iframe
                  title="map"
                  src={mapSrc}
                  width="100%"
                  height="360"
                  style={{ border: 0 }}
                  loading="lazy"
                />
              </div>

              <div className="text-muted small px-2 pt-2">
                {item.latitude && item.longitude
                  ? `Coordinates: ${item.latitude}, ${item.longitude}`
                  : "Using address search (no coordinates provided)."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
