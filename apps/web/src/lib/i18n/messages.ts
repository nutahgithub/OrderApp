export type Locale = "en";

export const defaultLocale: Locale = "en";

export const MessageKey = {
  AuthSessionExpired: "auth.sessionExpired",
  AuthLoginFailedTitle: "auth.login.failed.title",
  AuthInvalidCredentials: "auth.invalidCredentials",
  RequestFailed: "common.requestFailed",
  ResourceNotFound: "common.resourceNotFound",
  SystemUnavailable: "common.systemUnavailable",
  ValidationFailed: "common.validationFailed"
} as const;

export type MessageKey = (typeof MessageKey)[keyof typeof MessageKey];

type MessageDictionary = Record<MessageKey, string>;

const en: MessageDictionary = {
  [MessageKey.AuthSessionExpired]: "Your session has expired. Please sign in again.",
  [MessageKey.AuthLoginFailedTitle]: "Login failed",
  [MessageKey.AuthInvalidCredentials]: "Email or password is incorrect. Please check and try again.",
  [MessageKey.RequestFailed]: "The request could not be completed. Please try again.",
  [MessageKey.ResourceNotFound]: "The requested item could not be found.",
  [MessageKey.SystemUnavailable]: "The system is temporarily unavailable. Please try again later.",
  [MessageKey.ValidationFailed]: "Some information is invalid. Please check and try again."
};

const dictionaries: Record<Locale, MessageDictionary> = {
  en
};

export const t = (key: MessageKey, locale: Locale = defaultLocale): string => {
  return dictionaries[locale][key];
};
