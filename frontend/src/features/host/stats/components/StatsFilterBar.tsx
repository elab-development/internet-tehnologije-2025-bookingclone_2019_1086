import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import ReactDatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

import { parseApiDate, toApiDate } from "../../../../shared/utils/date";
import type { ApartmentOption } from "../../apartments/hooks/useHostApartmentOptions";
import type { StatsFilters } from "../hooks/useHostStats";
import type { EarningsGroupBy } from "../services/statsService";

const DatePicker = ReactDatePicker as unknown as React.FC<any>;

type Props = {
  filters: StatsFilters;
  apartmentOptions: ApartmentOption[];
  disabled?: boolean;
  onApply: (next: StatsFilters) => void;
  onReset: () => void;
};

type Preset = {
  labelKey: string;
  build: () => { from: Date; to: Date; groupBy: EarningsGroupBy };
};

const PRESETS: Preset[] = [
  {
    labelKey: "stats.presets.thisYear",
    build: () => {
      const year = new Date().getFullYear();

      return {
        from: new Date(year, 0, 1),
        to: new Date(year, 11, 31),
        groupBy: "month",
      };
    },
  },
  {
    labelKey: "stats.presets.lastYear",
    build: () => {
      const year = new Date().getFullYear() - 1;

      return {
        from: new Date(year, 0, 1),
        to: new Date(year, 11, 31),
        groupBy: "month",
      };
    },
  },
  {
    labelKey: "stats.presets.last12Months",
    build: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth() - 11, 1);

      return { from, to: now, groupBy: "month" };
    },
  },
  {
    labelKey: "stats.presets.allYears",
    build: () => {
      const year = new Date().getFullYear();

      // Grouped by year, so a long stretch stays a handful of readable bars.
      return {
        from: new Date(year - 5, 0, 1),
        to: new Date(year, 11, 31),
        groupBy: "year",
      };
    },
  },
];

export default function StatsFilterBar({
  filters,
  apartmentOptions,
  disabled,
  onApply,
  onReset,
}: Props) {
  const { t } = useTranslation();

  const [groupBy, setGroupBy] = useState<EarningsGroupBy>(filters.groupBy);
  const [dateFrom, setDateFrom] = useState(parseApiDate(filters.dateFrom));
  const [dateTo, setDateTo] = useState(parseApiDate(filters.dateTo));
  const [apartmentId, setApartmentId] = useState(filters.apartmentId);

  // Follow the hook when a preset or the reset button changes the period.
  useEffect(() => {
    setGroupBy(filters.groupBy);
    setDateFrom(parseApiDate(filters.dateFrom));
    setDateTo(parseApiDate(filters.dateTo));
    setApartmentId(filters.apartmentId);
  }, [filters]);

  function handleFromChange(date: Date | null) {
    setDateFrom(date);

    if (date && dateTo && date > dateTo) {
      setDateTo(null);
    }
  }

  function handlePreset(preset: Preset) {
    const { from, to, groupBy: presetGroupBy } = preset.build();

    onApply({
      groupBy: presetGroupBy,
      dateFrom: toApiDate(from),
      dateTo: toApiDate(to),
      apartmentId,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onApply({
      groupBy,
      dateFrom: dateFrom ? toApiDate(dateFrom) : "",
      dateTo: dateTo ? toApiDate(dateTo) : "",
      apartmentId,
    });
  }

  return (
    <section className="host-stats__filters">
      <div className="host-stats__presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.labelKey}
            type="button"
            className="host-stats__preset"
            disabled={disabled}
            onClick={() => handlePreset(preset)}
          >
            {t(preset.labelKey)}
          </button>
        ))}
      </div>

      <form className="host-stats__filter-form" onSubmit={handleSubmit}>
        <div className="host-stats__field">
          <label className="host-stats__label">{t("stats.filters.from")}</label>

          <DatePicker
            selected={dateFrom}
            onChange={handleFromChange}
            selectsStart
            startDate={dateFrom}
            endDate={dateTo}
            dateFormat="dd.MM.yyyy"
            placeholderText="dd.mm.yyyy"
            className="host-stats__input"
            isClearable
          />
        </div>

        <div className="host-stats__field">
          <label className="host-stats__label">{t("stats.filters.to")}</label>

          <DatePicker
            selected={dateTo}
            onChange={setDateTo}
            selectsEnd
            startDate={dateFrom}
            endDate={dateTo}
            minDate={dateFrom ?? undefined}
            dateFormat="dd.MM.yyyy"
            placeholderText="dd.mm.yyyy"
            className="host-stats__input"
            isClearable
          />
        </div>

        <div className="host-stats__field">
          <label className="host-stats__label" htmlFor="stats-group-by">
            {t("stats.filters.groupBy")}
          </label>

          <select
            id="stats-group-by"
            className="host-stats__input"
            value={groupBy}
            onChange={(event) =>
              setGroupBy(event.target.value as EarningsGroupBy)
            }
          >
            <option value="month">{t("stats.filters.byMonth")}</option>
            <option value="year">{t("stats.filters.byYear")}</option>
          </select>
        </div>

        <div className="host-stats__field host-stats__field--wide">
          <label className="host-stats__label" htmlFor="stats-apartment">
            {t("stats.filters.apartment")}
          </label>

          <select
            id="stats-apartment"
            className="host-stats__input"
            value={apartmentId ?? ""}
            onChange={(event) =>
              setApartmentId(
                event.target.value ? Number(event.target.value) : null
              )
            }
          >
            <option value="">{t("stats.filters.apartmentAll")}</option>

            {apartmentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
              </option>
            ))}
          </select>
        </div>

        <div className="host-stats__actions">
          <button
            type="submit"
            className="host-stats__button"
            disabled={disabled}
          >
            {t("stats.filters.apply")}
          </button>

          <button
            type="button"
            className="host-stats__reset"
            disabled={disabled}
            onClick={onReset}
          >
            {t("stats.filters.reset")}
          </button>
        </div>
      </form>
    </section>
  );
}
