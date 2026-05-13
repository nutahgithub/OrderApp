import { ApiClientError } from "../api/client";
import { MessageKey, t } from "./messages";

const errorCodeToMessageKey: Record<string, MessageKey> = {
  INTERNAL_ERROR: MessageKey.SystemUnavailable,
  INVALID_CREDENTIALS: MessageKey.AuthInvalidCredentials,
  VALIDATION_ERROR: MessageKey.ValidationFailed
};

export const getUserErrorMessage = (error: unknown, fallbackKey = MessageKey.RequestFailed): string => {
  if (error instanceof ApiClientError) {
    const messageKey = errorCodeToMessageKey[error.code];

    return t(messageKey ?? fallbackKey);
  }

  return t(fallbackKey);
};

