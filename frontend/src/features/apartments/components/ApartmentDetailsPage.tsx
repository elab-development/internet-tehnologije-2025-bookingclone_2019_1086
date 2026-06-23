import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
  type ApartmentDto,
  getApartmentById,
  getMainPhotoUrl,
} from "../services/apartmentService";

function buildMapSrc(args: {
  lat?: string | null;
  lon?: string | null;
  address?: string;
  city?: string;
  country?: string;
}) {
  const { lat, lon, address, city, country } = args;

  if (lat && lon) {
    const latitude = Number(lat);
    const longitude = Number(lon);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      const delta = 0.01;
      const left = longitude - delta;
      const right = longitude + delta;
      const top = latitude + delta;
      const bottom = latitude - delta;

      return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;
    }
  }

  const queryValue = [address, city, country].filter(Boolean).join(", ");
  const query = encodeURIComponent(queryValue || "Belgrade");

  return `https://www.openstreetmap.org/export/embed.html?search=${query}`;
}

export default function ApartmentDetailsPage() {
  const params = useParams();
  const apartmentId = Number(params.id);

  const [item, setItem] = useState<ApartmentDto | null>(null);
  const [activePhotoUrl, setActivePhotoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadApartment() {
      setLoading(true);
      setError(null);

      try {
        if (!Number.isFinite(apartmentId)) {
          throw new Error("Invalid apartment id.");
        }

        const apartment = await getApartmentById(apartmentId);

        if (cancelled) {
          return;
        }

        setItem(apartment);
        setActivePhotoUrl(getMainPhotoUrl(apartment));
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Failed to load apartment";

          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadApartment();

    return () => {
      cancelled = true;
    };
  }, [apartmentId]);

  const mapSrc = useMemo(() => {
    if (!item) {
      return "";
    }

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
  const photos =
    item.photos.length > 0
      ? item.photos
      : [{ id: 0, image_url: getMainPhotoUrl(item), is_main: true }];

  return (
    <div className="container my-4" style={{ maxWidth: 1100 }}>
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

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-12 col-lg-8">
              <img
                src={activePhotoUrl}
                alt={item.title}
                className="w-100 rounded-4"
                style={{ height: 420, objectFit: "cover" }}
              />
            </div>

            <div className="col-12 col-lg-4">
              <div className="row g-2">
                {photos.slice(0, 6).map((photo) => (
                  <div key={photo.id} className="col-4 col-lg-6">
                    <button
                      type="button"
                      className="btn p-0 w-100"
                      onClick={() => setActivePhotoUrl(photo.image_url)}
                      style={{ border: "none" }}
                    >
                      <img
                        src={photo.image_url}
                        alt={`${item.title} thumbnail`}
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

      <div className="row g-4">
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

              {item.tags && item.tags.length > 0 ? (
                <div className="d-flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag.id ?? tag.name}
                      className="badge text-bg-light border rounded-pill px-3 py-2"
                    >
                      {tag.name ?? String(tag)}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-muted">No tags/facilities.</div>
              )}
            </div>
          </div>
        </div>

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
                  : "Using address search because coordinates are not provided."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}