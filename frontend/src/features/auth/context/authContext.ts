import { createContext } from "react";

import type { AuthUser } from "../types/authTypes";

export type AuthContextValue = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  signIn: (accessToken: string, user: AuthUser) => void;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
