import { ApiClientError } from "../api/client";
import { MessageKey, t } from "./messages";
import type { Locale } from "./messages";

const errorCodeToMessageKey: Record<string, MessageKey> = {
  BRANCH_NOT_FOUND: MessageKey.ResourceNotFound,
  INTERNAL_ERROR: MessageKey.SystemUnavailable,
  INVALID_CREDENTIALS: MessageKey.AuthInvalidCredentials,
  INVALID_UPLOAD: MessageKey.MenusImageInvalid,
  INVALID_TOKEN: MessageKey.AuthSessionExpired,
  MENU_NOT_FOUND: MessageKey.ResourceNotFound,
  MISSING_AUTH_CONTEXT: MessageKey.AuthSessionExpired,
  MISSING_TOKEN: MessageKey.AuthSessionExpired,
  ORDER_NOT_FOUND: MessageKey.ResourceNotFound,
  TABLE_NOT_FOUND: MessageKey.ResourceNotFound,
  TOKEN_EXPIRED: MessageKey.AuthSessionExpired,
  VALIDATION_ERROR: MessageKey.ValidationFailed
};

export const getUserErrorMessage = (
  error: unknown,
  fallbackKey = MessageKey.RequestFailed,
  locale?: Locale
): string => {
  if (error instanceof ApiClientError) {
    const messageKey = errorCodeToMessageKey[error.code];

    return t(messageKey ?? fallbackKey, locale);
  }

  return t(fallbackKey, locale);
};
