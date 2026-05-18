import type { Locale } from "../i18n/messages";

export const formatDateTime = (value: string, locale: Locale): string => {
  return new Date(value).toLocaleString(locale);
};

export const toDateInputValue = (date: Date): string => date.toISOString().slice(0, 10);

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
