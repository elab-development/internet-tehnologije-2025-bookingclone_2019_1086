import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
  type ApartmentDto,
  type ApartmentPhotoDto,
  type ApartmentTagDto,
  getApartmentById,
  getMainPhotoUrl,
} from "../services/apartmentService";

import ApartmentDetailsGallery from "./details/ApartmentDetailsGallery";
import ApartmentDetailsBookingCard from "./details/ApartmentDetailsBookingCard";
import ApartmentDetailsInfo from "./details/ApartmentDetailsInfo";
import ApartmentDetailsMap from "./details/ApartmentDetailsMap";

import "./ApartmentDetailsPage.css";

export type ApartmentDetailsDto = ApartmentDto & {
  tags?: ApartmentTagDto[];
};

const FALLBACK_PHOTO: ApartmentPhotoDto = {
  id: 0,
  image_url: "https://picsum.photos/1200/800",
  is_main: true,
};

function getApartmentPhotos(apartment: ApartmentDetailsDto) {
  if (apartment.photos.length > 0) {
    return apartment.photos;
  }

  return [FALLBACK_PHOTO];
}

function getLocationText(apartment: ApartmentDetailsDto) {
  const parts = [apartment.city, apartment.country].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(", ");
  }

  return "Location not available";
}

function getTags(apartment: ApartmentDetailsDto) {
  if (Array.isArray(apartment.tags)) {
    return apartment.tags;
  }

  return [];
}

export default function ApartmentDetailsPage() {
  const params = useParams();
  const apartmentId = Number(params.id);

  const [apartment, setApartment] = useState<ApartmentDetailsDto | null>(null);
  const [activePhotoUrl, setActivePhotoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadApartment() {
      setIsLoading(true);
      setError("");

      try {
        if (!Number.isFinite(apartmentId)) {
          throw new Error("Invalid apartment id.");
        }

        const response = await getApartmentById(apartmentId);
        const details = response as ApartmentDetailsDto;

        if (cancelled) {
          return;
        }

        setApartment(details);
        setActivePhotoUrl(getMainPhotoUrl(details));
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        if (loadError instanceof Error) {
          setError(loadError.message);
          return;
        }

        setError("Failed to load apartment.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadApartment();

    return () => {
      cancelled = true;
    };
  }, [apartmentId]);

  const photos = useMemo(() => {
    if (!apartment) {
      return [FALLBACK_PHOTO];
    }

    return getApartmentPhotos(apartment);
  }, [apartment]);

  if (isLoading) {
    return (
      <main className="apartment-details-page">
        <div className="apartment-details-page__container">
          <div className="apartment-details-state">Loading apartment...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="apartment-details-page">
        <div className="apartment-details-page__container">
          <div className="apartment-details-state apartment-details-state--error">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!apartment) {
    return (
      <main className="apartment-details-page">
        <div className="apartment-details-page__container">
          <div className="apartment-details-state apartment-details-state--error">
            Apartment not found.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="apartment-details-page">
      <div className="apartment-details-page__container">
        <header className="apartment-details-header">
          <div className="apartment-details-header__content">
            <p className="apartment-details-header__eyebrow">
              {getLocationText(apartment)}
            </p>

            <h1 className="apartment-details-header__title">
              {apartment.title}
            </h1>

            <p className="apartment-details-header__address">
              {apartment.address}
            </p>
          </div>
        </header>

        <ApartmentDetailsGallery
          title={apartment.title}
          photos={photos}
          activePhotoUrl={activePhotoUrl}
          onPhotoSelect={setActivePhotoUrl}
        />

        <section className="apartment-details-summary">
          <div className="apartment-details-summary__item">
            <strong>{apartment.max_guests}</strong>
            <span>Guests</span>
          </div>

          <div className="apartment-details-summary__item">
            <strong>{apartment.reviews_count}</strong>
            <span>Reviews</span>
          </div>

          <div className="apartment-details-summary__item">
            <strong>{apartment.status}</strong>
            <span>Status</span>
          </div>
        </section>

        <div className="apartment-details-layout">
          <div className="apartment-details-layout__main">
            <ApartmentDetailsInfo
              description={apartment.description}
              tags={getTags(apartment)}
            />

            <ApartmentDetailsMap apartment={apartment} />
          </div>

          <aside className="apartment-details-layout__sidebar">
            <ApartmentDetailsBookingCard apartment={apartment} />
          </aside>
        </div>
      </div>
    </main>
  );
}