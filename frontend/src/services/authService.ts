// const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const API_BASE = "http://localhost:8000";

export type Role = "USER" | "ADMIN" | "HOST";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: Role;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  role?: Role; // defaults to USER on backend anyway
};

export type RegisterResponse = {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: AuthUser;
};

export type LoginResponse = {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
};

function buildUrl(path: string): string {
  return `${API_BASE}${path}`;
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    return "Request failed";
  } catch {
    return "Request failed";
  }
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const res = await fetch(buildUrl("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return (await res.json()) as RegisterResponse;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);

  const res = await fetch(buildUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    credentials: "include",
    body,
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return (await res.json()) as LoginResponse;
}

export async function me(): Promise<AuthUser> {
  const token = localStorage.getItem("access_token");

  const res = await fetch(buildUrl("/auth/me"), {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return (await res.json()) as AuthUser;
}

export async function refresh(): Promise<LoginResponse> {
  const res = await fetch(buildUrl("/auth/refresh"), {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return (await res.json()) as LoginResponse;
}

export async function logout(): Promise<void> {
  const res = await fetch(buildUrl("/auth/logout"), {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }
}