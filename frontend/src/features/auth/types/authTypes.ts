export type Role = "USER" | "HOST" | "ADMIN";

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
  role?: Role;
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