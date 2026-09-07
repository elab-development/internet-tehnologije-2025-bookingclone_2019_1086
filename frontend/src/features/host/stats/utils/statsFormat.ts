import type { EarningsGroupBy, EarningsPointDto } from "../services/statsService";

export const BAR_COLOR = "#2a78d6";

export const SHARE_RAMP = [
  "#0d366b",
  "#184f95",
  "#256abf",
  "#3987e5",
  "#86b6ef",
];


export const MAX_SHARE_SLICES = SHARE_RAMP.length;

/** Grid and axis ink: one step off the surface, never louder than the data. */
export const GRID_COLOR = "#e9ecef";
export const AXIS_TEXT_COLOR = "#6c757d";

export function toNumber(value: string | number | null | undefined): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatMoney(value: string | number | null | undefined): string {
  return `€${Math.round(toNumber(value)).toLocaleString("de-DE")}`;
}

export function buildAxisMoneyFormatter(maxValue: number) {
  const useShortForm = Math.abs(maxValue) >= 10000;

  return (value: number): string => {
    if (value === 0) {
      return "€0";
    }

    if (!useShortForm) {
      return `€${Math.round(value).toLocaleString("de-DE")}`;
    }

    const thousands = value / 1000;
    const decimals = Number.isInteger(thousands) ? 0 : 1;

    return `€${thousands.toLocaleString("de-DE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}k`;
  };
}

export function formatPercent(value: string | number | null | undefined): string {
  return `${toNumber(value).toFixed(1)}%`;
}

const MONTH_KEYS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

export function formatPeriod(
  period: string,
  groupBy: EarningsGroupBy,
  translateMonth: (key: string) => string
): string {
  if (groupBy === "year") {
    return period;
  }

  const parts = period.split("-");

  if (parts.length !== 2) {
    return period;
  }

  const monthIndex = Number(parts[1]) - 1;

  if (monthIndex < 0 || monthIndex >= MONTH_KEYS.length) {
    return period;
  }

  return `${translateMonth(MONTH_KEYS[monthIndex])} ${parts[0].slice(2)}`;
}

export type EarningsTotals = {
  total: number;
  nights: number;
  reservations: number;
  best: EarningsPointDto | null;
};


export function sumEarnings(points: EarningsPointDto[]): EarningsTotals {
  let total = 0;
  let nights = 0;
  let reservations = 0;
  let best: EarningsPointDto | null = null;

  for (const point of points) {
    total += toNumber(point.total);
    nights += point.nights;
    reservations += point.reservations;

    if (!best || toNumber(point.total) > toNumber(best.total)) {
      best = point;
    }
  }

  if (best && toNumber(best.total) <= 0) {
    best = null;
  }

  return { total, nights, reservations, best };
}
