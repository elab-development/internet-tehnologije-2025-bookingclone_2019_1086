import { useTranslation } from "react-i18next";

import ApartmentList from "../features/apartments/components/ApartmentList";
import HomeSearchForm from "./components/HomeSearchForm";

import "./HomePage.css";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero__content">
          <div className="home-hero__text">
            <span className="home-hero__eyebrow">{t("home.eyebrow")}</span>

            <h1 className="home-hero__title">{t("home.title")}</h1>

            <p className="home-hero__description">{t("home.description")}</p>
          </div>

          <HomeSearchForm />
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