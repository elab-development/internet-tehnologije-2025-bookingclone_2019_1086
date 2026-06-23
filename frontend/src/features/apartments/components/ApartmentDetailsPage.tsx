import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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

function getTags(apartment: ApartmentDetailsDto) {
  if (Array.isArray(apartment.tags)) {
    return apartment.tags;
  }

  return [];
}

export default function ApartmentDetailsPage() {
  const { t } = useTranslation();
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
          throw new Error(t("apartments.details.errors.invalidId"));
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

        setError(t("apartments.details.errors.loadFailed"));
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
  }, [apartmentId, t]);

  const photos = useMemo(() => {
    if (!apartment) {
      return [FALLBACK_PHOTO];
    }

    return getApartmentPhotos(apartment);
  }, [apartment]);

  function getLocationText() {
    if (!apartment) {
      return t("apartments.details.locationNotAvailable");
    }

    const parts = [apartment.city, apartment.country].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(", ");
    }

    return t("apartments.details.locationNotAvailable");
  }

  function getStatusLabel(status: string) {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === "active") {
      return t("apartments.details.status.active");
    }

    if (normalizedStatus === "inactive") {
      return t("apartments.details.status.inactive");
    }

    if (normalizedStatus === "pending") {
      return t("apartments.details.status.pending");
    }

    return status;
  }

  if (isLoading) {
    return (
      <main className="apartment-details-page">
        <div className="apartment-details-page__container">
          <div className="apartment-details-state">
            {t("apartments.details.loading")}
          </div>
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
            {t("apartments.details.notFound")}
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
              {getLocationText()}
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
            <span>{t("apartments.details.summary.guests")}</span>
          </div>

          <div className="apartment-details-summary__item">
            <strong>{apartment.reviews_count}</strong>
            <span>{t("apartments.details.summary.reviews")}</span>
          </div>

          <div className="apartment-details-summary__item">
            <strong>{getStatusLabel(apartment.status)}</strong>
            <span>{t("apartments.details.summary.status")}</span>
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