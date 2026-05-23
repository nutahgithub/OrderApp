import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AdminProfile } from "../../lib/api/types";
import { authSessionExpiredEvent } from "../../lib/api/http";
import { authApi } from "./api";
import { clearAuthSession, readAuthSession, saveAuthSession } from "./auth-storage";
import { readTokenExpiresAt } from "./auth-token";

type LoginInput = {
  email: string;
  password: string;
};

type AuthContextValue = {
  admin: AdminProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState(() => readAuthSession());

  const login = useCallback(async (input: LoginInput) => {
    const response = await authApi.loginAdmin(input);
    const nextSession = {
      token: response.token,
      admin: response.admin
    };

    saveAuthSession(nextSession);
    setSession(nextSession);
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setSession(null);
  }, []);

  useEffect(() => {
    window.addEventListener(authSessionExpiredEvent, logout);

    return () => {
      window.removeEventListener(authSessionExpiredEvent, logout);
    };
  }, [logout]);

  useEffect(() => {
    if (!session?.token) {
      return undefined;
    }

    const expiresAt = readTokenExpiresAt(session.token);

    if (!expiresAt) {
      return undefined;
    }

    const delay = expiresAt - Date.now();

    if (delay <= 0) {
      logout();
      return undefined;
    }

    const timeoutId = window.setTimeout(logout, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [logout, session?.token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      admin: session?.admin ?? null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session?.token),
      login,
      logout
    }),
    [login, logout, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
