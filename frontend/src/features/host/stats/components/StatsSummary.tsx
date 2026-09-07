import { useTranslation } from "react-i18next";

import type { EarningsGroupBy } from "../services/statsService";
import {
  formatMoney,
  formatPeriod,
  type EarningsTotals,
} from "../utils/statsFormat";

type Props = {
  totals: EarningsTotals;
  groupBy: EarningsGroupBy;
};


export default function StatsSummary({ totals, groupBy }: Props) {
  const { t } = useTranslation();

  const bestLabel = totals.best
    ? formatPeriod(totals.best.period, groupBy, (key) =>
        t(`stats.months.${key}`)
      )
    : "—";

  const tiles = [
    { key: "total", label: t("stats.summary.total"), value: formatMoney(totals.total) },
    {
      key: "reservations",
      label: t("stats.summary.reservations"),
      value: String(totals.reservations),
    },
    {
      key: "nights",
      label: t("stats.summary.nights"),
      value: String(totals.nights),
    },
    {
      key: "best",
      label:
        groupBy === "year"
          ? t("stats.summary.bestYear")
          : t("stats.summary.bestMonth"),
      value: bestLabel,
    },
  ];

  return (
    <section className="host-stats__summary">
      {tiles.map((tile) => (
        <div key={tile.key} className="host-stats__tile">
          <span className="host-stats__tile-label">{tile.label}</span>
          <span className="host-stats__tile-value">{tile.value}</span>
        </div>
      ))}
    </section>
  );
}
