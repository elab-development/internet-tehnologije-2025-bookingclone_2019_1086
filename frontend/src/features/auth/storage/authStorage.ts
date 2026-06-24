import type { AuthUser } from "../types/authTypes";

const ACCESS_TOKEN_KEY = "access_token";
const AUTH_USER_KEY = "auth_user";

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

export function setAuthUser(user: AuthUser) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function getAuthUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    clearAuthUser();
    return null;
  }
}

export function clearAuthUser() {
  localStorage.removeItem(AUTH_USER_KEY);
}

export function logoutLocal() {
  clearAccessToken();
  clearAuthUser();
}