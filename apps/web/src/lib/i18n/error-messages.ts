import { ApiClientError } from "../api/client";
import { MessageKey, t } from "./messages";

const errorCodeToMessageKey: Record<string, MessageKey> = {
  INTERNAL_ERROR: MessageKey.SystemUnavailable,
  INVALID_CREDENTIALS: MessageKey.AuthInvalidCredentials,
  INVALID_TOKEN: MessageKey.AuthSessionExpired,
  MISSING_AUTH_CONTEXT: MessageKey.AuthSessionExpired,
  MISSING_TOKEN: MessageKey.AuthSessionExpired,
  TOKEN_EXPIRED: MessageKey.AuthSessionExpired,
  VALIDATION_ERROR: MessageKey.ValidationFailed
};

export const getUserErrorMessage = (error: unknown, fallbackKey = MessageKey.RequestFailed): string => {
  if (error instanceof ApiClientError) {
    const messageKey = errorCodeToMessageKey[error.code];

    return t(messageKey ?? fallbackKey);
  }

  return t(fallbackKey);
};
