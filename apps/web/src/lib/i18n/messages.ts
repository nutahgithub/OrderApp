export type Locale = "en";

export const defaultLocale: Locale = "en";

export const MessageKey = {
  AuthLoginFailedTitle: "auth.login.failed.title",
  AuthInvalidCredentials: "auth.invalidCredentials",
  RequestFailed: "common.requestFailed",
  SystemUnavailable: "common.systemUnavailable",
  ValidationFailed: "common.validationFailed"
} as const;

export type MessageKey = (typeof MessageKey)[keyof typeof MessageKey];

type MessageDictionary = Record<MessageKey, string>;

const en: MessageDictionary = {
  [MessageKey.AuthLoginFailedTitle]: "Login failed",
  [MessageKey.AuthInvalidCredentials]: "Email or password is incorrect. Please check and try again.",
  [MessageKey.RequestFailed]: "The request could not be completed. Please try again.",
  [MessageKey.SystemUnavailable]: "The system is temporarily unavailable. Please try again later.",
  [MessageKey.ValidationFailed]: "Some information is invalid. Please check and try again."
};

const dictionaries: Record<Locale, MessageDictionary> = {
  en
};

export const t = (key: MessageKey, locale: Locale = defaultLocale): string => {
  return dictionaries[locale][key];
};
