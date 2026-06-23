import { useEffect, useState } from "react";

import ApartmentCard from "./ApartmentCard";
import {
  type ApartmentDto,
  type ApartmentSearchParams,
  getApartments,
  getMainPhotoUrl,
} from "../services/apartmentService";

import "./ApartmentList.css";

type Props = {
  searchParams?: ApartmentSearchParams;
};

export default function ApartmentList({ searchParams }: Props) {
  const [apartments, setApartments] = useState<ApartmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadApartments() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getApartments({
          page_number: 1,
          page_size: 12,
          ...searchParams,
        });

        if (!cancelled) {
          setApartments(response.items);
        }
      } catch (error) {
        if (!cancelled) {
          handleLoadError(error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadApartments();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  function handleLoadError(error: unknown) {
    if (error instanceof Error) {
      setError(error.message);
      return;
    }

    setError("Failed to load apartments");
  }

  function renderLoading() {
    if (!isLoading) {
      return null;
    }

    return <div className="apartment-list__message">Loading apartments...</div>;
  }

  function renderError() {
    if (!error) {
      return null;
    }

    return <div className="apartment-list__error">{error}</div>;
  }

  function renderEmptyState() {
    if (isLoading || error || apartments.length > 0) {
      return null;
    }

    return <div className="apartment-list__message">No apartments found.</div>;
  }

  function renderApartments() {
    if (isLoading || error) {
      return null;
    }

    return (
      <div className="apartment-list__grid">
        {apartments.map((apartment) => (
          <ApartmentCard
            key={apartment.id}
            id={apartment.id}
            name={apartment.title}
            country={apartment.country}
            city={apartment.city}
            imageUrl={getMainPhotoUrl(apartment)}
            pricePerNight={apartment.price_per_night}
          />
        ))}
      </div>
    );
  }

  return (
    <section className="apartment-list">
      {renderLoading()}
      {renderError()}
      {renderEmptyState()}
      {renderApartments()}
    </section>
  );
}