export function parseRating(
  value: string | number | null | undefined
): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

/** A whole number stays whole, 8.33 keeps one decimal: 8, 8.3, 9.2. */
export function formatRating(value: string | number | null | undefined): string {
  const parsed = parseRating(value);

  if (parsed === null) {
    return "";
  }

  const rounded = Math.round(parsed * 10) / 10;

  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** The word that rides next to the score, the way booking sites label them. */
export function ratingWordKey(
  value: string | number | null | undefined
): string | null {
  const parsed = parseRating(value);

  if (parsed === null) {
    return null;
  }

  if (parsed >= 9) {
    return "exceptional";
  }

  if (parsed >= 8) {
    return "veryGood";
  }

  if (parsed >= 7) {
    return "good";
  }

  if (parsed >= 6) {
    return "pleasant";
  }

  return "poor";
}
