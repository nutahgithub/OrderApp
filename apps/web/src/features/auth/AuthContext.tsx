import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiClient } from "../../lib/api/client";
import type { AdminProfile } from "../../lib/api/types";
import { clearAuthSession, readAuthSession, saveAuthSession } from "./auth-storage";

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
    const response = await apiClient.loginAdmin(input);
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

