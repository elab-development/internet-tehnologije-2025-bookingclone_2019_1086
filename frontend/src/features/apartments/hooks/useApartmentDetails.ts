import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getApartmentById,
  getMainPhotoUrl,
} from "../services/apartmentService";

import {
  FALLBACK_APARTMENT_PHOTO,
  getApartmentPhotos,
  type ApartmentDetailsDto,
} from "../types/apartmentDetailsTypes";

export function useApartmentDetails(apartmentId: number) {
  const { t } = useTranslation();

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
      return [FALLBACK_APARTMENT_PHOTO];
    }

    return getApartmentPhotos(apartment);
  }, [apartment]);

  return {
    apartment,
    photos,
    activePhotoUrl,
    setActivePhotoUrl,
    isLoading,
    error,
  };
}