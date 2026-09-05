import { apiRequest } from "../../../shared/api/apiClient";
import { resolveImageUrl } from "../../apartments/services/apartmentService";
import type { BasePagedResponse } from "../../apartments/services/apartmentService";

export type ReservationStatus = "pending" | "confirmed" | "cancelled";

const DEFAULT_PAGE_SIZE = 10;

export type ReservationApartmentDto = {
  id: number;
  title: string;
  city: string;
  country: string;
  image_url: string | null;
};

export type ReservationDto = {
  id: number;
  apartment_id: number;
  user_id: number;
  check_in: string;
  check_out: string;
  nights: number;
  guests_count: number;
  total_price: string;
  status: ReservationStatus;
  created_at: string;
  apartment: ReservationApartmentDto | null;
  guest_name: string | null;
};

export type ReservationSearchParams = {
  page_number?: number;
  page_size?: number;
  status?: ReservationStatus;
};

export type CreateReservationRequest = {
  apartment_id: number;
  check_in: string;
  check_out: string;
  guests_count: number;
};

export type RentedDay = {
  date: string;
  rented: boolean;
};

function normalizeReservation(value: ReservationDto): ReservationDto {
  if (!value.apartment || !value.apartment.image_url) {
    return value;
  }

  return {
    ...value,
    apartment: {
      ...value.apartment,
      image_url: resolveImageUrl(value.apartment.image_url),
    },
  };
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
}

/** Dates are sent as plain YYYY-MM-DD so the timezone cannot shift the day. */
export function toApiDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function createReservation(body: CreateReservationRequest) {
  const created = await apiRequest<ReservationDto>("/reservations", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });

  return normalizeReservation(created);
}

async function getReservationsPage(
  path: string,
  args?: ReservationSearchParams
): Promise<BasePagedResponse<ReservationDto>> {
  const query = buildQuery({
    page_number: args?.page_number ?? 1,
    page_size: args?.page_size ?? DEFAULT_PAGE_SIZE,
    status: args?.status,
  });

  const response = await apiRequest<BasePagedResponse<ReservationDto>>(
    `${path}${query}`,
    { method: "GET", auth: true }
  );

  return {
    ...response,
    items: (response.items ?? []).map(normalizeReservation),
  };
}

export async function getMyReservations(args?: ReservationSearchParams) {
  return getReservationsPage("/reservations", args);
}

export async function getHostReservations(args?: ReservationSearchParams) {
  return getReservationsPage("/reservations/host", args);
}

export async function updateReservationStatus(
  reservationId: number,
  status: "confirmed" | "cancelled"
) {
  const updated = await apiRequest<ReservationDto>(
    `/reservations/${reservationId}`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify({ status }),
    }
  );

  return normalizeReservation(updated);
}

export async function getRentedDays(
  apartmentId: number,
  year: number,
  month: number
) {
  return apiRequest<RentedDay[]>(
    `/apartments/${apartmentId}/rented-days?year=${year}&month=${month}`,
    { method: "GET" }
  );
}
