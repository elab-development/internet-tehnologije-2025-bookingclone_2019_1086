import {
  getAccessToken,
  setAccessToken,
} from "../../features/auth/storage/authStorage";
import { buildApiUrl } from "../config/api";

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
};

// Set by AuthProvider so the app can clear itself when the refresh token is
// gone too and there is nothing left to retry with.
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

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

async function requestNewAccessToken(): Promise<string | null> {
  // The refresh token lives in an httponly cookie, so it rides along on its
  // own instead of being read from JavaScript.
  const response = await fetch(buildApiUrl("/auth/refresh"), {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  if (typeof data?.access_token !== "string") {
    return null;
  }

  setAccessToken(data.access_token);

  return data.access_token;
}

// Every refresh burns the old token and hands out a new one, so two calls at
// once would make the second one arrive with a token the server just revoked.
// Whoever asks while a refresh is running waits for that same one.
let pendingRefresh: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (!pendingRefresh) {
    pendingRefresh = requestNewAccessToken()
      .catch(() => null)
      .finally(() => {
        pendingRefresh = null;
      });
  }

  return pendingRefresh;
}

function sendRequest(path: string, options: ApiRequestOptions) {
  const { auth: _auth, ...fetchOptions } = options;

  return fetch(buildApiUrl(path), {
    ...fetchOptions,
    headers: buildHeaders(options),
    credentials: "include",
  });
}

async function readResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  let response = await sendRequest(path, options);

  // The access token only lasts 15 minutes. When it runs out mid-session the
  // refresh token buys a new one and the call is repeated, so the user never
  // notices.
  if (response.status === 401 && options.auth) {
    const newToken = await refreshAccessToken();

    if (!newToken) {
      onSessionExpired?.();
      throw new Error(await parseApiError(response));
    }

    response = await sendRequest(path, options);
  }

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return readResponse<T>(response);
}
