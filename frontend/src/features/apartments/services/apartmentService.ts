import { getAccessToken } from "../../auth/storage/authStorage";

/* ============================
   TYPES
   ============================ */

export type ApartmentPhotoDto = {
  id: number;
  image_url: string;
  is_main: boolean;
};

export type ApartmentTagDto = {
  id?: number;
  name?: string;
};

export type ApartmentDto = {
  id: number;
  user_id: number;
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  price_per_night: string;
  max_guests: number;
  status: string;
  latitude: string | null;
  longitude: string | null;
  rating_average: string | number | null;
  reviews_count: number;
  photos: ApartmentPhotoDto[];
  tags?: ApartmentTagDto[];
};

export type BasePagedResponse<T> = {
  page_number: number;
  page_size: number;
  total: number;
  items: T[];
};

export type ApartmentSearchParams = {
  page_number?: number;
  page_size?: number;
  name?: string;
  city?: string;
  country?: string;
};

export type ApartmentCreateRequest = {
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  price_per_night: number;
  max_guests: number;
  tag_ids: number[];
};

/* ============================
   CONFIG
   ============================ */

export const API_BASE = "http://localhost:8000";

const APARTMENT_PLACEHOLDER_IMAGE = "https://picsum.photos/600/400";

/* ============================
   HELPERS
   ============================ */

export function resolveImageUrl(url: string) {
  if (!url) {
    return url;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("/")) {
    return encodeURI(`${API_BASE}${url}`);
  }

  return encodeURI(`${API_BASE}/${url}`);
}

export function getMainPhoto(apartment: ApartmentDto) {
  const mainPhoto = apartment.photos.find((photo) => photo.is_main);

  return mainPhoto ?? apartment.photos[0] ?? null;
}

export function getMainPhotoUrl(apartment: ApartmentDto) {
  const photo = getMainPhoto(apartment);

  return photo?.image_url ?? APARTMENT_PLACEHOLDER_IMAGE;
}

export function formatApartmentPrice(price: string | number | null | undefined) {
  const value = Number(price);

  if (!Number.isFinite(value)) {
    return "€0";
  }

  return `€${value.toFixed(0)}`;
}

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

async function readErrorResponse(response: Response, fallbackMessage: string) {
  const text = await response.text();

  return text || `${fallbackMessage} (${response.status})`;
}

function getAuthHeaders() {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Not logged in");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

/* ============================
   NORMALIZATION
   ============================ */

function normalizePhoto(photo: unknown): ApartmentPhotoDto {
  const value = photo as {
    id?: number | string;
    image_url?: string;
    path?: string;
    is_main?: boolean;
  };

  const rawImageUrl = value?.image_url ?? value?.path ?? "";

  return {
    id: Number(value?.id ?? 0),
    image_url: resolveImageUrl(String(rawImageUrl)),
    is_main: Boolean(value?.is_main),
  };
}

function normalizeApartment(apartment: unknown): ApartmentDto {
  const value = apartment as {
    id?: number | string;
    user_id?: number | string;
    title?: string;
    description?: string;
    address?: string;
    city?: string;
    country?: string;
    price_per_night?: string | number;
    max_guests?: number | string;
    status?: string;
    latitude?: string | null;
    longitude?: string | null;
    rating_average?: string | number | null;
    reviews_count?: number | string;
    photos?: unknown[];
    tags?: ApartmentTagDto[];
  };

  const photosRaw = Array.isArray(value?.photos) ? value.photos : [];

  return {
    id: Number(value?.id ?? 0),
    user_id: Number(value?.user_id ?? 0),
    title: String(value?.title ?? ""),
    description: String(value?.description ?? ""),
    address: String(value?.address ?? ""),
    city: String(value?.city ?? ""),
    country: String(value?.country ?? ""),
    price_per_night: String(value?.price_per_night ?? "0"),
    max_guests: Number(value?.max_guests ?? 0),
    status: String(value?.status ?? ""),
    latitude: value?.latitude ?? null,
    longitude: value?.longitude ?? null,
    rating_average: value?.rating_average ?? null,
    reviews_count: Number(value?.reviews_count ?? 0),
    photos: photosRaw.map(normalizePhoto),
    tags: Array.isArray(value?.tags) ? value.tags : [],
  };
}

/* ============================
   PUBLIC APARTMENTS
   ============================ */

export async function getApartments(args?: ApartmentSearchParams) {
  const query = buildQuery({
    page_number: args?.page_number ?? 1,
    page_size: args?.page_size ?? 12,
    name: args?.name,
    city: args?.city,
    country: args?.country,
  });

  const response = await fetch(`${API_BASE}/apartments${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      await readErrorResponse(response, "Failed to load apartments")
    );
  }

  const json = (await response.json()) as BasePagedResponse<unknown>;

  return {
    ...json,
    items: (json.items ?? []).map(normalizeApartment),
  } as BasePagedResponse<ApartmentDto>;
}

export async function getApartmentById(id: number) {
  const response = await fetch(`${API_BASE}/apartments/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      await readErrorResponse(response, "Failed to load apartment")
    );
  }

  const json = await response.json();

  return normalizeApartment(json);
}

/* ============================
   HOST APARTMENTS
   ============================ */

export async function getMyApartments(args?: ApartmentSearchParams) {
  const query = buildQuery({
    page_number: args?.page_number ?? 1,
    page_size: args?.page_size ?? 12,
    name: args?.name,
    city: args?.city,
    country: args?.country,
  });

  const response = await fetch(`${API_BASE}/apartments/my${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(
      await readErrorResponse(response, "Failed to load my apartments")
    );
  }

  const json = (await response.json()) as BasePagedResponse<unknown>;

  return {
    ...json,
    items: (json.items ?? []).map(normalizeApartment),
  } as BasePagedResponse<ApartmentDto>;
}

export async function createApartment(body: ApartmentCreateRequest) {
  const response = await fetch(`${API_BASE}/apartments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorResponse(response, "Failed to create apartment")
    );
  }

  return normalizeApartment(await response.json());
}

export async function uploadApartmentPhotos(apartmentId: number, photos: File[]) {
  const formData = new FormData();

  photos.forEach((photo) => {
    formData.append("photos", photo);
  });

  const response = await fetch(`${API_BASE}/apartments/${apartmentId}/photos`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      await readErrorResponse(response, "Failed to upload photos")
    );
  }

  const created = (await response.json()) as unknown[];

  return created.map(normalizePhoto);
}

export async function deleteApartment(apartmentId: number) {
  const response = await fetch(`${API_BASE}/apartments/${apartmentId}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(
      await readErrorResponse(response, "Failed to delete apartment")
    );
  }
}