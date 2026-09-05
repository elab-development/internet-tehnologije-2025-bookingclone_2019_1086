import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import ApartmentList from "../features/apartments/components/ApartmentList";
import type { ApartmentSearchParams } from "../features/apartments/services/apartmentService";
import ApartmentsSearchBar from "./components/ApartmentsSearchBar";

import "./ApartmentsPage.css";

export default function ApartmentsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const name = searchParams.get("name") ?? "";
  const city = searchParams.get("city") ?? "";
  const guests = searchParams.get("guests") ?? "";

  // Built from primitives so ApartmentList does not refetch on every render.
  const listParams = useMemo<ApartmentSearchParams>(() => {
    const params: ApartmentSearchParams = {
      page_number: 1,
      page_size: 12,
    };

    if (name) {
      params.name = name;
    }

    if (city) {
      params.city = city;
    }

    const parsedGuests = Number(guests);

    if (Number.isFinite(parsedGuests) && parsedGuests > 0) {
      params.max_guests = parsedGuests;
    }

    return params;
  }, [name, city, guests]);

  function handleSearch(next: { name: string; city: string; guests: string }) {
    const params = new URLSearchParams();

    if (next.name) {
      params.set("name", next.name);
    }

    if (next.city) {
      params.set("city", next.city);
    }

    if (next.guests) {
      params.set("guests", next.guests);
    }

    setSearchParams(params);
  }

  function handleReset() {
    setSearchParams(new URLSearchParams());
  }

  const hasFilters = Boolean(name || city || guests);

  return (
    <main className="apartments-page">
      <header className="apartments-page__header">
        <h1 className="apartments-page__title">{t("apartmentsPage.title")}</h1>

        <p className="apartments-page__subtitle">
          {t("apartmentsPage.subtitle")}
        </p>
      </header>

      <ApartmentsSearchBar
        name={name}
        city={city}
        guests={guests}
        hasFilters={hasFilters}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <ApartmentList searchParams={listParams} />
    </main>
  );
}
