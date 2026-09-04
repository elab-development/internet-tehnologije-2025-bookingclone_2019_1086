import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";

import * as authService from "../services/authService";
import {
  getAuthUser,
  logoutLocal,
  setAccessToken,
  setAuthUser,
} from "../storage/authStorage";
import type { AuthUser } from "../types/authTypes";

import { AuthContext, type AuthContextValue } from "./authContext";

type AuthProviderProps = {
  children: ReactNode;
};

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(getAuthUser);

  const signIn = useCallback((accessToken: string, nextUser: AuthUser) => {
    setAccessToken(accessToken);
    setAuthUser(nextUser);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // The local session is cleared even when the backend call fails.
    } finally {
      logoutLocal();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      isLoggedIn: user !== null,
      signIn,
      signOut,
    };
  }, [user, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
