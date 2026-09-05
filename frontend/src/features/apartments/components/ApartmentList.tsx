import { useEffect, useState } from "react";

import ApartmentCard from "./ApartmentCard";
import Pagination from "../../../shared/components/Pagination";
import {
  type ApartmentDto,
  type ApartmentSearchParams,
  getApartments,
  getMainPhotoUrl,
} from "../services/apartmentService";

import "./ApartmentList.css";

const DEFAULT_PAGE_SIZE = 12;

type Props = {
  searchParams?: ApartmentSearchParams;
  /** Pass together with onPageChange when the page has to live outside, e.g. in the URL. */
  page?: number;
  onPageChange?: (page: number) => void;
};

export default function ApartmentList({
  searchParams,
  page,
  onPageChange,
}: Props) {
  const [apartments, setApartments] = useState<ApartmentDto[]>([]);
  const [total, setTotal] = useState(0);
  const [internalPage, setInternalPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentPage = page ?? internalPage;
  const pageSize = searchParams?.page_size ?? DEFAULT_PAGE_SIZE;

  useEffect(() => {
    let cancelled = false;

    async function loadApartments() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getApartments({
          ...searchParams,
          page_number: currentPage,
          page_size: pageSize,
        });

        if (!cancelled) {
          setApartments(response.items);
          setTotal(response.total);
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
  }, [searchParams, currentPage, pageSize]);

  // New filters always start from the first page.
  useEffect(() => {
    setInternalPage(1);
  }, [searchParams]);

  function handleLoadError(error: unknown) {
    if (error instanceof Error) {
      setError(error.message);
      return;
    }

    setError("Failed to load apartments");
  }

  function handlePageChange(nextPage: number) {
    if (onPageChange) {
      onPageChange(nextPage);
      return;
    }

    setInternalPage(nextPage);
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

  function renderPagination() {
    if (error) {
      return null;
    }

    return (
      <Pagination
        page={currentPage}
        pageSize={pageSize}
        total={total}
        disabled={isLoading}
        onPageChange={handlePageChange}
      />
    );
  }

  return (
    <section className="apartment-list">
      {renderLoading()}
      {renderError()}
      {renderEmptyState()}
      {renderApartments()}
      {renderPagination()}
    </section>
  );
}
