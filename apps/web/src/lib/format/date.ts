export const parseDateInputValue = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return Number.isNaN(date.getTime()) ? null : date;
};

const padDatePart = (value: number): string => String(value).padStart(2, "0");

export const formatDate = (value: string | Date): string => {
  const date = typeof value === "string" ? (parseDateInputValue(value) ?? new Date(value)) : value;

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${padDatePart(date.getDate())}/${padDatePart(date.getMonth() + 1)}/${date.getFullYear()}`;
};

export const formatDateTime = (value: string | Date): string => {
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${formatDate(date)} ${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
};

export const toDateInputValue = (date: Date): string => {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
};

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
