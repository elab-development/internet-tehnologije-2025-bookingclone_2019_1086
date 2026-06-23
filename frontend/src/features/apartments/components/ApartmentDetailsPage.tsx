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

import ApartmentDetailsHeader from "./details/ApartmentDetailsHeader";
import ApartmentDetailsGallery from "./details/ApartmentDetailsGallery";
import ApartmentDetailsSummary from "./details/ApartmentDetailsSummary";
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
        <ApartmentDetailsHeader apartment={apartment} />

        <ApartmentDetailsGallery
          title={apartment.title}
          photos={photos}
          activePhotoUrl={activePhotoUrl}
          onPhotoSelect={setActivePhotoUrl}
        />

        <ApartmentDetailsSummary apartment={apartment} />

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