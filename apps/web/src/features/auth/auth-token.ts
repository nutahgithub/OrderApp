type JwtPayload = {
  exp?: unknown;
};

const decodeBase64Url = (value: string): string => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);

  return window.atob(base64 + padding);
};

export const readTokenExpiresAt = (token: string): number | null => {
  const [, encodedPayload] = token.split(".");

  if (!encodedPayload) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as JwtPayload;

    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string, now = Date.now()): boolean => {
  const expiresAt = readTokenExpiresAt(token);

  return expiresAt !== null && expiresAt <= now;
};
