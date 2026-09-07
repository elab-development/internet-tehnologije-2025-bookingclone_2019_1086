import { apiRequest } from "../../../shared/api/apiClient";
import { toApiDate } from "../../../shared/utils/date";
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
  is_deleted: boolean;
};

export type ReservationReviewDto = {
  id: number;
  rating: number;
  comment: string | null;
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
  review: ReservationReviewDto | null;
  is_reviewable: boolean;
};

export type ReservationSearchParams = {
  page_number?: number;
  page_size?: number;
  status?: ReservationStatus;
  date_from?: string;
  date_to?: string;
  apartment_id?: number;
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

export { toApiDate };

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
    date_from: args?.date_from,
    date_to: args?.date_to,
    apartment_id: args?.apartment_id,
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

// --- the page behind a link from a reservation mail ---

export type ReservationLinkDto = {
  reservation: ReservationDto;
  can_manage: boolean;
};

function normalizeLink(value: ReservationLinkDto): ReservationLinkDto {
  return {
    ...value,
    reservation: normalizeReservation(value.reservation),
  };
}

export async function getReservationByLink(token: string) {
  const response = await apiRequest<ReservationLinkDto>(
    `/reservations/link/${token}`,
    { method: "GET", auth: true }
  );

  return normalizeLink(response);
}

export async function updateReservationByLink(
  token: string,
  status: "confirmed" | "cancelled"
) {
  const response = await apiRequest<ReservationLinkDto>(
    `/reservations/link/${token}`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify({ status }),
    }
  );

  return normalizeLink(response);
}
