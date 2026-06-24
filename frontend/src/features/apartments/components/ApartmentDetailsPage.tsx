import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { useApartmentDetails } from "../hooks/useApartmentDetails";
import { getApartmentTags } from "../types/apartmentDetailsTypes";

import ApartmentDetailsHeader from "./details/ApartmentDetailsHeader";
import ApartmentDetailsGallery from "./details/ApartmentDetailsGallery";
import ApartmentDetailsSummary from "./details/ApartmentDetailsSummary";
import ApartmentDetailsBookingCard from "./details/ApartmentDetailsBookingCard";
import ApartmentDetailsInfo from "./details/ApartmentDetailsInfo";
import ApartmentDetailsMap from "./details/ApartmentDetailsMap";

import "./ApartmentDetailsPage.css";

export type { ApartmentDetailsDto } from "../types/apartmentDetailsTypes";

export default function ApartmentDetailsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const apartmentId = Number(params.id);

  const {
    apartment,
    photos,
    activePhotoUrl,
    setActivePhotoUrl,
    isLoading,
    error,
  } = useApartmentDetails(apartmentId);

  function handleShowPhotosClick() {
    const galleryScroller = document.querySelector<HTMLElement>(
      ".apartment-gallery__scroller"
    );

    if (!galleryScroller) {
      return;
    }

    galleryScroller.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }

  async function handleShareClick() {
    const shareUrl = window.location.href;

    if (!apartment) {
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: apartment.title,
          url: shareUrl,
        });

        return;
      }

      await navigator.clipboard.writeText(shareUrl);
    } catch {
      return;
    }
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
        <ApartmentDetailsHeader
          apartment={apartment}
          onShowPhotosClick={handleShowPhotosClick}
          onShareClick={handleShareClick}
        />

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
              tags={getApartmentTags(apartment)}
            />
          </div>

          <aside className="apartment-details-layout__sidebar">
            <ApartmentDetailsBookingCard apartment={apartment} />
          </aside>
        </div>

        <ApartmentDetailsMap apartment={apartment} />
      </div>
    </main>
  );
}