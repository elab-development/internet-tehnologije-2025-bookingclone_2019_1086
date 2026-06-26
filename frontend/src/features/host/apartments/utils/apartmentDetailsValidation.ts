import type { ApartmentDetailsState } from "../steps/StepApartmentDetails";

export type ApartmentDetailsValidationMessages = {
  requiredFields: string;
  invalidPrice: string;
  invalidGuests: string;
};

export function createInitialDetailsState(): ApartmentDetailsState {
  return {
    title: "",
    description: "",
    address: "",
    city: "",
    country: "",
    price_per_night: "",
    max_guests: "",
  };
}

export function validateApartmentDetails(
  value: ApartmentDetailsState,
  messages: ApartmentDetailsValidationMessages
) {
  const title = value.title.trim();
  const description = value.description.trim();
  const address = value.address.trim();
  const city = value.city.trim();
  const country = value.country.trim();

  if (!title || !description || !address || !city || !country) {
    throw new Error(messages.requiredFields);
  }

  const price = Number(value.price_per_night);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(messages.invalidPrice);
  }

  const guests = Number(value.max_guests);

  if (!Number.isFinite(guests) || guests < 1) {
    throw new Error(messages.invalidGuests);
  }
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}