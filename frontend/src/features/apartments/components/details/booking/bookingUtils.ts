export function calculateNights(
  checkInDate: Date | null,
  checkOutDate: Date | null
) {
  if (!checkInDate) {
    return 0;
  }

  if (!checkOutDate) {
    return 0;
  }

  const milliseconds = checkOutDate.getTime() - checkInDate.getTime();
  const nights = Math.ceil(milliseconds / 86_400_000);

  if (nights < 1) {
    return 0;
  }

  return nights;
}

export function getPriceValue(price: string | number | null | undefined) {
  const value = Number(price);

  if (!Number.isFinite(value)) {
    return 0;
  }

  return value;
}