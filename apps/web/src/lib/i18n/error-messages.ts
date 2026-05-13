import { ApiClientError } from "../api/client";
import { MessageKey, t } from "./messages";

const errorCodeToMessageKey: Record<string, MessageKey> = {
  BRANCH_NOT_FOUND: MessageKey.ResourceNotFound,
  INTERNAL_ERROR: MessageKey.SystemUnavailable,
  INVALID_CREDENTIALS: MessageKey.AuthInvalidCredentials,
  INVALID_TOKEN: MessageKey.AuthSessionExpired,
  MISSING_AUTH_CONTEXT: MessageKey.AuthSessionExpired,
  MISSING_TOKEN: MessageKey.AuthSessionExpired,
  TABLE_NOT_FOUND: MessageKey.ResourceNotFound,
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
