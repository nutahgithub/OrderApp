import type { Locale } from "../i18n/messages";

export const formatCurrency = (value: string | number, locale: Locale = "vi"): string => {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 2
  }).format(Number(value));
};
