import type { ApartmentCreateRequest } from "../../../apartments/services/apartmentService";
import type { ApartmentDetailsState } from "../steps/StepApartmentDetails";

export function createApartmentPayload(
  details: ApartmentDetailsState,
  selectedTagIds: number[]
): ApartmentCreateRequest {
  return {
    title: details.title.trim(),
    description: details.description.trim(),
    address: details.address.trim(),
    city: details.city.trim(),
    country: details.country.trim(),
    price_per_night: Number(details.price_per_night),
    max_guests: Number(details.max_guests),
    tag_ids: selectedTagIds,
  };
}