import { useTranslation } from "react-i18next";

import ApartmentShareChart from "../components/ApartmentShareChart";
import EarningsBarChart from "../components/EarningsBarChart";
import StatsFilterBar from "../components/StatsFilterBar";
import StatsSummary from "../components/StatsSummary";
import { useHostStats } from "../hooks/useHostStats";

import "../styles/HostStatsPage.css";

export default function HostStatsPage() {
  const { t } = useTranslation();

  const {
    filters,
    apartmentOptions,
    earnings,
    shares,
    totals,
    isLoading,
    error,
    applyFilters,
    resetFilters,
    isEmpty,
  } = useHostStats();

  function renderState() {
    if (isLoading) {
      return <p className="host-stats__state">{t("stats.loading")}</p>;
    }

    if (error) {
      return (
        <p className="host-stats__state host-stats__state--error">{error}</p>
      );
    }

    if (isEmpty) {
      return <p className="host-stats__state">{t("stats.empty")}</p>;
    }

    return null;
  }

  function renderCharts() {
    if (isLoading || error || isEmpty) {
      return null;
    }

    return (
      <>
        <StatsSummary totals={totals} groupBy={filters.groupBy} />

        <section className="host-stats__card">
          <h2 className="host-stats__card-title">
            {filters.groupBy === "year"
              ? t("stats.charts.byYear")
              : t("stats.charts.byMonth")}
          </h2>

          <p className="host-stats__card-note">
            {filters.groupBy === "year"
              ? t("stats.charts.noteYear")
              : t("stats.charts.note")}
          </p>

          <EarningsBarChart points={earnings} groupBy={filters.groupBy} />
        </section>

        <section className="host-stats__card">
          <h2 className="host-stats__card-title">
            {t("stats.charts.byApartment")}
          </h2>

          <p className="host-stats__card-note">
            {t("stats.charts.byApartmentNote")}
          </p>

          <ApartmentShareChart shares={shares} />
        </section>
      </>
    );
  }

  return (
    <main className="host-stats">
      <header className="host-stats__header">
        <h1 className="host-stats__title">{t("stats.title")}</h1>

        <p className="host-stats__subtitle">{t("stats.subtitle")}</p>
      </header>

      <StatsFilterBar
        filters={filters}
        apartmentOptions={apartmentOptions}
        disabled={isLoading}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {renderState()}

      {renderCharts()}
    </main>
  );
}
