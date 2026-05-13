import type { AdminProfile } from "../../lib/api/types";

const tokenKey = "orderapp.admin.token";
const adminKey = "orderapp.admin.profile";

export type StoredAuthSession = {
  token: string;
  admin: AdminProfile;
};

export const saveAuthSession = (session: StoredAuthSession): void => {
  window.localStorage.setItem(tokenKey, session.token);
  window.localStorage.setItem(adminKey, JSON.stringify(session.admin));
};

export const readAuthSession = (): StoredAuthSession | null => {
  const token = window.localStorage.getItem(tokenKey);
  const adminJson = window.localStorage.getItem(adminKey);

  if (!token || !adminJson) {
    return null;
  }

  try {
    const admin = JSON.parse(adminJson) as AdminProfile;

    return {
      token,
      admin
    };
  } catch {
    window.localStorage.removeItem(tokenKey);
    window.localStorage.removeItem(adminKey);
    return null;
  }
};

export const clearAuthSession = (): void => {
  window.localStorage.removeItem(tokenKey);
  window.localStorage.removeItem(adminKey);
};

