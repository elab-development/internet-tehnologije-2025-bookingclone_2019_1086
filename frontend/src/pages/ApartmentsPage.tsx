import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import ApartmentList from "../features/apartments/components/ApartmentList";
import type { ApartmentSearchParams } from "../features/apartments/services/apartmentService";
import ApartmentsSearchBar from "./components/ApartmentsSearchBar";

import "./ApartmentsPage.css";

function readPage(value: string | null) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

export default function ApartmentsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const name = searchParams.get("name") ?? "";
  const city = searchParams.get("city") ?? "";
  const guests = searchParams.get("guests") ?? "";
  const page = readPage(searchParams.get("page"));

  // Built from primitives so ApartmentList does not refetch on every render.
  const listParams = useMemo<ApartmentSearchParams>(() => {
    const params: ApartmentSearchParams = {
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

  // The page lives in the URL, so a reloaded or shared link opens the same results.
  function handlePageChange(nextPage: number) {
    const params = new URLSearchParams(searchParams);

    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }

    setSearchParams(params);
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

      <ApartmentList
        searchParams={listParams}
        page={page}
        onPageChange={handlePageChange}
      />
    </main>
  );
}
