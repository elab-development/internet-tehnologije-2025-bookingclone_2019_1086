import { apiRequest } from "../../../../shared/api/apiClient";

export type EarningsGroupBy = "month" | "year";

export type EarningsPointDto = {
  period: string; // 'YYYY-MM' when grouped by month, 'YYYY' when by year
  total: string;
  nights: number;
  reservations: number;
};

export type ApartmentShareDto = {
  apartment_id: number;
  title: string;
  total: string;
  nights: number;
  reservations: number;
  share_percent: string;
  is_deleted: boolean;
};

export type StatsParams = {
  group_by?: EarningsGroupBy;
  date_from?: string;
  date_to?: string;
  apartment_id?: number | null;
};

function buildQuery(params: Record<string, string | number | undefined | null>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
}

export async function getHostEarnings(params: StatsParams) {
  const query = buildQuery({
    group_by: params.group_by ?? "month",
    date_from: params.date_from,
    date_to: params.date_to,
    apartment_id: params.apartment_id,
  });

  const response = await apiRequest<EarningsPointDto[]>(
    `/stats/host/earnings${query}`,
    { method: "GET", auth: true }
  );

  return response ?? [];
}

export async function getHostEarningsByApartment(params: StatsParams) {
  const query = buildQuery({
    date_from: params.date_from,
    date_to: params.date_to,
    apartment_id: params.apartment_id,
  });

  const response = await apiRequest<ApartmentShareDto[]>(
    `/stats/host/by-apartment${query}`,
    { method: "GET", auth: true }
  );

  return response ?? [];
}
