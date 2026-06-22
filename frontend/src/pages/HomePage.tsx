import { useTranslation } from "react-i18next";

import ApartmentList from "../features/apartments/components/ApartmentList";

import "./HomePage.css";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero__content">
          <div className="home-hero__text">
            <span className="home-hero__eyebrow">
              {t("home.eyebrow")}
            </span>

            <h1 className="home-hero__title">
              {t("home.title")}
            </h1>

            <p className="home-hero__description">
              {t("home.description")}
            </p>
          </div>

          <form className="home-search">
            <div className="home-search__field">
              <label className="home-search__label">
                {t("home.search.location")}
              </label>

              <input
                type="text"
                className="home-search__input"
                placeholder={t("home.search.locationPlaceholder")}
              />
            </div>

            <div className="home-search__field">
              <label className="home-search__label">
                {t("home.search.checkIn")}
              </label>

              <input type="date" className="home-search__input" />
            </div>

            <div className="home-search__field">
              <label className="home-search__label">
                {t("home.search.checkOut")}
              </label>

              <input type="date" className="home-search__input" />
            </div>

            <div className="home-search__field home-search__field--small">
              <label className="home-search__label">
                {t("home.search.guests")}
              </label>

              <input
                type="number"
                min="1"
                className="home-search__input"
                placeholder="2"
              />
            </div>

            <button type="submit" className="home-search__button">
              {t("home.search.button")}
            </button>
          </form>
        </div>
      </section>

      <section className="home-apartments">
        <div className="home-apartments__header">
          <div>
            <h2 className="home-apartments__title">
              {t("home.apartmentsTitle")}
            </h2>

            <p className="home-apartments__description">
              {t("home.apartmentsDescription")}
            </p>
          </div>
        </div>

        <ApartmentList />
      </section>
    </div>
  );
}