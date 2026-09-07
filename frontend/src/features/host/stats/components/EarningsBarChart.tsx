import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { EarningsGroupBy, EarningsPointDto } from "../services/statsService";
import {
  AXIS_TEXT_COLOR,
  BAR_COLOR,
  GRID_COLOR,
  buildAxisMoneyFormatter,
  formatMoney,
  formatPeriod,
  toNumber,
} from "../utils/statsFormat";

type Props = {
  points: EarningsPointDto[];
  groupBy: EarningsGroupBy;
};

type ChartRow = {
  label: string;
  total: number;
  nights: number;
  reservations: number;
};

export default function EarningsBarChart({ points, groupBy }: Props) {
  const { t } = useTranslation();

  const rows: ChartRow[] = points.map((point) => ({
    label: formatPeriod(point.period, groupBy, (key) => t(`stats.months.${key}`)),
    total: toNumber(point.total),
    nights: point.nights,
    reservations: point.reservations,
  }));

  // The tallest bar decides how every tick on the axis is written.
  const formatAxisMoney = buildAxisMoneyFormatter(
    rows.reduce((highest, row) => Math.max(highest, row.total), 0)
  );

  function renderTooltip({ active, payload }: any) {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const row = payload[0].payload as ChartRow;

    return (
      <div className="host-stats__tooltip">
        <div className="host-stats__tooltip-title">{row.label}</div>

        <div className="host-stats__tooltip-value">{formatMoney(row.total)}</div>

        <div className="host-stats__tooltip-meta">
          {t("stats.tooltip.reservations", { count: row.reservations })} ·{" "}
          {t("stats.tooltip.nights", { count: row.nights })}
        </div>
      </div>
    );
  }

  return (
    <div className="host-stats__chart">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>

          <CartesianGrid stroke={GRID_COLOR} vertical={false} />

          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: GRID_COLOR }}
            tick={{ fill: AXIS_TEXT_COLOR, fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={8}
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            width={68}
            tick={{ fill: AXIS_TEXT_COLOR, fontSize: 12 }}
            tickFormatter={formatAxisMoney}
          />

          <Tooltip
            content={renderTooltip}
            cursor={{ fill: "rgba(13, 110, 253, 0.06)" }}
          />

          <Bar
            dataKey="total"
            fill={BAR_COLOR}
            maxBarSize={24}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
