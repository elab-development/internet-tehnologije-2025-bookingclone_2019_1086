import { getAccessToken } from "../../features/auth/storage/authStorage";
import { buildApiUrl } from "../config/api";

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
};

async function parseApiError(response: Response): Promise<string> {
  const text = await response.text();

  if (!text) {
    return `Request failed (${response.status})`;
  }

  try {
    const data = JSON.parse(text);

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (typeof data?.error === "string") {
      return data.error;
    }

    return `Request failed (${response.status})`;
  } catch {
    return text;
  }
}

function buildHeaders(options: ApiRequestOptions): HeadersInit {
  const headers = new Headers(options.headers);

  const isFormData = options.body instanceof FormData;
  const isUrlEncoded = options.body instanceof URLSearchParams;

  if (!isFormData && !isUrlEncoded && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (isUrlEncoded && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/x-www-form-urlencoded");
  }

  if (options.auth) {
    const token = getAccessToken();

    if (!token) {
      throw new Error("Not logged in");
    }

    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { auth: _auth, ...fetchOptions } = options;

  const response = await fetch(buildApiUrl(path), {
    ...fetchOptions,
    headers: buildHeaders(options),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}