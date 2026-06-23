import { useEffect, useState } from "react";

import ApartmentCard from "./ApartmentCard";

import "./ApartmentList.css";

const API_BASE_URL = "http://localhost:8000";

type ApartmentPhoto = {
  id: number;
  image_url: string;
  is_main: boolean;
};

type Apartment = {
  id: number;
  user_id: number;
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  price_per_night: string;
  max_guests: number;
  status: string;
  latitude: string | null;
  longitude: string | null;
  rating_average: string | number | null;
  reviews_count: number;
  photos: ApartmentPhoto[];
};

type ApartmentsResponse = {
  page_number: number;
  page_size: number;
  total: number;
  items: Apartment[];
};

export default function ApartmentList() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApartments();
  }, []);

  async function loadApartments() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/apartments?page_number=1&page_size=12`
      );

      if (!response.ok) {
        throw new Error("Failed to load apartments");
      }

      const data: ApartmentsResponse = await response.json();

      setApartments(data.items);
    } catch (error) {
      handleLoadError(error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleLoadError(error: unknown) {
    if (error instanceof Error) {
      setError(error.message);
      return;
    }

    setError("Failed to load apartments");
  }

  function buildImageUrl(imageUrl: string) {
    if (imageUrl.startsWith("http")) {
      return imageUrl;
    }

    if (imageUrl.startsWith("/")) {
      return encodeURI(`${API_BASE_URL}${imageUrl}`);
    }

    return encodeURI(`${API_BASE_URL}/${imageUrl}`);
  }

  function getApartmentMainPhoto(apartment: Apartment) {
    if (!apartment.photos || apartment.photos.length === 0) {
      return null;
    }

    const mainPhoto = apartment.photos.find((photo) => photo.is_main);

    if (mainPhoto) {
      return mainPhoto;
    }

    return apartment.photos[0];
  }

  function getApartmentMainImage(apartment: Apartment) {
    const photo = getApartmentMainPhoto(apartment);

    if (!photo) {
      return "/images/apartment-placeholder.jpg";
    }

    return buildImageUrl(photo.image_url);
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
    if (isLoading) {
      return null;
    }

    if (error) {
      return null;
    }

    if (apartments.length > 0) {
      return null;
    }

    return <div className="apartment-list__message">No apartments found.</div>;
  }

  function renderApartments() {
    if (isLoading) {
      return null;
    }

    if (error) {
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
            imageUrl={getApartmentMainImage(apartment)}
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