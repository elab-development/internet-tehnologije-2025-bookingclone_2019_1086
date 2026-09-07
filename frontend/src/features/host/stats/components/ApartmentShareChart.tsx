import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { ApartmentShareDto } from "../services/statsService";
import {
  MAX_SHARE_SLICES,
  SHARE_RAMP,
  formatMoney,
  formatPercent,
  toNumber,
} from "../utils/statsFormat";

type Props = {
  shares: ApartmentShareDto[];
};

type Slice = {
  key: string;
  title: string;
  total: number;
  percent: number;
  reservations: number;
  isOther: boolean;
};

const LABEL_THRESHOLD_PERCENT = 12;

function labelInkFor(color: string): string {
  const value = parseInt(color.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6 ? "#0b0b0b" : "#ffffff";
}

export function buildSlices(shares: ApartmentShareDto[], otherLabel: string): Slice[] {
  const sorted = [...shares].sort(
    (left, right) => toNumber(right.total) - toNumber(left.total)
  );

  if (sorted.length <= MAX_SHARE_SLICES) {
    return sorted.map((share) => ({
      key: String(share.apartment_id),
      title: share.title,
      total: toNumber(share.total),
      percent: toNumber(share.share_percent),
      reservations: share.reservations,
      isOther: false,
    }));
  }

  const named = sorted.slice(0, MAX_SHARE_SLICES - 1);
  const rest = sorted.slice(MAX_SHARE_SLICES - 1);

  const slices: Slice[] = named.map((share) => ({
    key: String(share.apartment_id),
    title: share.title,
    total: toNumber(share.total),
    percent: toNumber(share.share_percent),
    reservations: share.reservations,
    isOther: false,
  }));

  slices.push({
    key: "other",
    title: otherLabel,
    total: rest.reduce((sum, share) => sum + toNumber(share.total), 0),
    percent: rest.reduce((sum, share) => sum + toNumber(share.share_percent), 0),
    reservations: rest.reduce((sum, share) => sum + share.reservations, 0),
    isOther: true,
  });

  return slices.sort((left, right) => right.total - left.total);
}

export default function ApartmentShareChart({ shares }: Props) {
  const { t } = useTranslation();

  const slices = buildSlices(shares, t("stats.share.other"));

  function renderTooltip({ active, payload }: any) {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const slice = payload[0].payload as Slice;

    return (
      <div className="host-stats__tooltip">
        <div className="host-stats__tooltip-title">{slice.title}</div>

        <div className="host-stats__tooltip-value">
          {formatMoney(slice.total)} · {formatPercent(slice.percent)}
        </div>

        <div className="host-stats__tooltip-meta">
          {t("stats.tooltip.reservations", { count: slice.reservations })}
        </div>
      </div>
    );
  }

  function renderSliceLabel(props: any) {
    const slice = slices[props.index];

    if (!slice || slice.percent < LABEL_THRESHOLD_PERCENT) {
      return null;
    }

    const isWholeRing = slices.length === 1;

    const radius = (props.innerRadius + props.outerRadius) / 2;
    const radians = -props.midAngle * (Math.PI / 180);

    const x = isWholeRing ? props.cx : props.cx + radius * Math.cos(radians);
    const y = isWholeRing ? props.cy : props.cy + radius * Math.sin(radians);

    return (
      <text
        x={x}
        y={y}
        fill={
          isWholeRing
            ? "#0b0b0b"
            : labelInkFor(SHARE_RAMP[props.index % SHARE_RAMP.length])
        }
        fontSize={isWholeRing ? 18 : 12}
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {formatPercent(slice.percent)}
      </text>
    );
  }

  return (
    <div className="host-stats__share">
      <div className="host-stats__share-chart">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="total"
              nameKey="title"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={104}

              stroke="#ffffff"
              strokeWidth={2}
              labelLine={false}
              label={renderSliceLabel}
              isAnimationActive={false}
            >
              {slices.map((slice, index) => (
                <Cell
                  key={slice.key}
                  fill={SHARE_RAMP[index % SHARE_RAMP.length]}
                />
              ))}
            </Pie>

            <Tooltip content={renderTooltip} />
          </PieChart>
        </ResponsiveContainer>
      </div>


      <ul className="host-stats__legend">
        {slices.map((slice, index) => (
          <li key={slice.key} className="host-stats__legend-row">
            <span
              className="host-stats__legend-swatch"
              style={{ background: SHARE_RAMP[index % SHARE_RAMP.length] }}
              aria-hidden="true"
            />

            <span className="host-stats__legend-title" title={slice.title}>
              {slice.title}
            </span>

            <span className="host-stats__legend-value">
              {formatMoney(slice.total)}
            </span>

            <span className="host-stats__legend-percent">
              {formatPercent(slice.percent)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
