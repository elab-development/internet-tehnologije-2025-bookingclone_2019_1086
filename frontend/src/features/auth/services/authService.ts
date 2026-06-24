import { apiRequest } from "../../../shared/api/apiClient";
import type {
  AuthUser,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
} from "../types/authTypes";

export type {
  AuthUser,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  Role,
} from "../types/authTypes";

export async function register(
  payload: RegisterPayload
): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const body = new URLSearchParams();

  body.set("username", email);
  body.set("password", password);

  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body,
  });
}

export async function me(): Promise<AuthUser> {
  return apiRequest<AuthUser>("/auth/me", {
    method: "GET",
    auth: true,
  });
}

export async function refresh(): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/refresh", {
    method: "POST",
  });
}

export async function logout(): Promise<void> {
  await apiRequest<void>("/auth/logout", {
    method: "POST",
  });
}