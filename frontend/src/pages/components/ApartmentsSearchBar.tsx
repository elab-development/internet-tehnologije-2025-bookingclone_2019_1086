import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  name: string;
  city: string;
  guests: string;
  hasFilters: boolean;
  onSearch: (next: { name: string; city: string; guests: string }) => void;
  onReset: () => void;
};

export default function ApartmentsSearchBar({
  name,
  city,
  guests,
  hasFilters,
  onSearch,
  onReset,
}: Props) {
  const { t } = useTranslation();

  const [nameValue, setNameValue] = useState(name);
  const [cityValue, setCityValue] = useState(city);
  const [guestsValue, setGuestsValue] = useState(guests);

  // Keep the inputs in step when the URL changes (back button, home search).
  useEffect(() => {
    setNameValue(name);
    setCityValue(city);
    setGuestsValue(guests);
  }, [name, city, guests]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSearch({
      name: nameValue.trim(),
      city: cityValue.trim(),
      guests: guestsValue.trim(),
    });
  }

  return (
    <form className="apartments-search" onSubmit={handleSubmit}>
      <div className="apartments-search__field">
        <label className="apartments-search__label" htmlFor="search-name">
          {t("apartmentsPage.search.name")}
        </label>

        <input
          id="search-name"
          className="apartments-search__input"
          value={nameValue}
          onChange={(event) => setNameValue(event.target.value)}
          placeholder={t("apartmentsPage.search.namePlaceholder")}
        />
      </div>

      <div className="apartments-search__field">
        <label className="apartments-search__label" htmlFor="search-city">
          {t("apartmentsPage.search.city")}
        </label>

        <input
          id="search-city"
          className="apartments-search__input"
          value={cityValue}
          onChange={(event) => setCityValue(event.target.value)}
          placeholder={t("apartmentsPage.search.cityPlaceholder")}
        />
      </div>

      <div className="apartments-search__field apartments-search__field--small">
        <label className="apartments-search__label" htmlFor="search-guests">
          {t("apartmentsPage.search.guests")}
        </label>

        <input
          id="search-guests"
          type="number"
          min="1"
          className="apartments-search__input"
          value={guestsValue}
          onChange={(event) => setGuestsValue(event.target.value)}
          placeholder="2"
        />
      </div>

      <div className="apartments-search__actions">
        <button type="submit" className="apartments-search__button">
          {t("apartmentsPage.search.submit")}
        </button>

        {hasFilters ? (
          <button
            type="button"
            className="apartments-search__reset"
            onClick={onReset}
          >
            {t("apartmentsPage.search.reset")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
