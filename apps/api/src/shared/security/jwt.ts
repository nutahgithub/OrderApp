import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";
import { ErrorCode } from "../errors/error-catalog.js";

type JwtHeader = {
  alg: "HS256";
  typ: "JWT";
};

export type AdminJwtPayload = {
  sub: string;
  tenantId: string;
  role: string;
  exp: number;
};

const base64UrlEncode = (value: string | Buffer): string => {
  return Buffer.from(value).toString("base64url");
};

const base64UrlJson = (value: JwtHeader | AdminJwtPayload): string => {
  return base64UrlEncode(JSON.stringify(value));
};

const sign = (value: string): string => {
  return createHmac("sha256", env.JWT_SECRET).update(value).digest("base64url");
};

export const createAdminToken = (payload: Omit<AdminJwtPayload, "exp">): string => {
  const header: JwtHeader = {
    alg: "HS256",
    typ: "JWT"
  };
  const expiresInSeconds = 60 * 60 * 8;
  const fullPayload: AdminJwtPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds
  };
  const encodedHeader = base64UrlJson(header);
  const encodedPayload = base64UrlJson(fullPayload);
  const signature = sign(`${encodedHeader}.${encodedPayload}`);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

const parsePayload = (encodedPayload: string): AdminJwtPayload => {
  const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<AdminJwtPayload>;

  if (!parsed.sub || !parsed.tenantId || !parsed.role || !parsed.exp) {
    throw new AppError(ErrorCode.InvalidToken);
  }

  return {
    sub: parsed.sub,
    tenantId: parsed.tenantId,
    role: parsed.role,
    exp: parsed.exp
  };
};

export const verifyAdminToken = (token: string): AdminJwtPayload => {
  const [encodedHeader, encodedPayload, signature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !signature) {
    throw new AppError(ErrorCode.InvalidToken);
  }

  const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    throw new AppError(ErrorCode.InvalidToken);
  }

  const payload = parsePayload(encodedPayload);

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new AppError(ErrorCode.TokenExpired);
  }

  return payload;
};
