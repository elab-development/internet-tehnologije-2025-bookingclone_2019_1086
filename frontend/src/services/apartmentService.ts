import { getAccessToken } from "../auth/authStorage";

/* ============================
   TYPES
   ============================ */

export type ApartmentPhotoDto = {
  id: number;
  image_url: string; // normalized to absolute URL
  is_main: boolean;
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
  rating_average: string | null;
  reviews_count: number;
  photos: ApartmentPhotoDto[];
};

export type BasePagedResponse<T> = {
  page_number: number;
  page_size: number;
  total: number;
  items: T[];
};

/* ============================
   CONFIG
   ============================ */

export const API_BASE = "http://localhost:8000";

export function resolveImageUrl(url: string) {
  if (!url) return url;

  // already absolute
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  // handle "/static/..."
  if (url.startsWith("/")) return `${API_BASE}${url}`;

  // handle "static/..."
  return `${API_BASE}/${url}`;
}

function buildQuery(params: Record<string, string | number | undefined | null>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

/* ============================
   NORMALIZATION
   ============================ */

// Backend might return photo as { path: "/static/..." } instead of { image_url: "/static/..." }
// This maps it safely and also resolves to absolute URL.
function normalizePhoto(p: any): ApartmentPhotoDto {
  const raw = p?.image_url ?? p?.path ?? "";
  return {
    id: Number(p?.id),
    image_url: resolveImageUrl(String(raw)),
    is_main: Boolean(p?.is_main),
  };
}

function normalizeApartment(a: any): ApartmentDto {
  const photosRaw = Array.isArray(a?.photos) ? a.photos : [];
  return {
    id: Number(a?.id),
    user_id: Number(a?.user_id),
    title: String(a?.title ?? ""),
    description: String(a?.description ?? ""),
    address: String(a?.address ?? ""),
    city: String(a?.city ?? ""),
    country: String(a?.country ?? ""),
    price_per_night: String(a?.price_per_night ?? "0"),
    max_guests: Number(a?.max_guests ?? 0),
    status: String(a?.status ?? ""),
    latitude: a?.latitude ?? null,
    longitude: a?.longitude ?? null,
    rating_average: a?.rating_average ?? null,
    reviews_count: Number(a?.reviews_count ?? 0),
    photos: photosRaw.map(normalizePhoto),
  };
}

/* ============================
   GET APARTMENTS (PUBLIC)
   ============================ */

export async function getApartments(args?: {
  page_number?: number;
  page_size?: number;
  name?: string;
  city?: string;
  country?: string;
}) {
  const query = buildQuery({
    page_number: args?.page_number ?? 1,
    page_size: args?.page_size ?? 12,
    name: args?.name,
    city: args?.city,
    country: args?.country,
  });

  const res = await fetch(`${API_BASE}/apartments${query}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to load apartments (${res.status})`);
  }

  const json = (await res.json()) as BasePagedResponse<any>;

  // normalize photo urls + shape
  return {
    ...json,
    items: (json.items ?? []).map(normalizeApartment),
  } as BasePagedResponse<ApartmentDto>;
}

/* ============================
   CREATE APARTMENT (HOST)
   ============================ */

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

export async function createApartment(body: ApartmentCreateRequest) {
  const token = getAccessToken();
  if (!token) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/apartments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to create apartment (${res.status})`);
  }

  return await res.json();
}

/* ============================
   UPLOAD PHOTOS (HOST)
   ============================ */

export async function uploadApartmentPhotos(apartmentId: number, photos: File[]) {
  const token = getAccessToken();
  if (!token) throw new Error("Not logged in");

  const fd = new FormData();
  for (const f of photos) fd.append("photos", f); // MUST be "photos"

  const res = await fetch(`${API_BASE}/apartments/${apartmentId}/photos`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // DO NOT set Content-Type for FormData
    },
    body: fd,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to upload photos (${res.status})`);
  }

  const created = (await res.json()) as any[];
  return created.map(normalizePhoto);
}


export async function getApartmentById(id: number) {
  const res = await fetch(`${API_BASE}/apartments/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to load apartment (${res.status})`);
  }

  const a = await res.json();

  // normalize photos to absolute urls (handles image_url or path)
  const photosRaw = Array.isArray(a?.photos) ? a.photos : [];
  const photos = photosRaw.map((p: any) => {
    const raw = p?.image_url ?? p?.path ?? "";
    return {
      id: Number(p?.id),
      image_url: resolveImageUrl(String(raw)),
      is_main: Boolean(p?.is_main),
    };
  });

  return {
    ...a,
    photos,
  } as ApartmentDto;
}



export async function getMyApartments(args?: {
  page_number?: number;
  page_size?: number;
  name?: string;
  city?: string;
  country?: string;
}) {
  const token = getAccessToken();
  if (!token) throw new Error("Not logged in");

  const query = buildQuery({
    page_number: args?.page_number ?? 1,
    page_size: args?.page_size ?? 12,
    name: args?.name,
    city: args?.city,
    country: args?.country,
  });

  const res = await fetch(`${API_BASE}/apartments/my${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to load my apartments (${res.status})`);
  }

  const json = (await res.json()) as BasePagedResponse<any>;

  return {
    ...json,
    items: (json.items ?? []).map(normalizeApartment),
  } as BasePagedResponse<ApartmentDto>;
}
