import * as Popover from "@radix-ui/react-popover";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { formatDate, parseDateInputValue, toDateInputValue } from "../../lib/format/date";
import { cn } from "../../lib/utils/cn";

type DateFieldProps = {
  label: string;
  value: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
  onValueChange: (value: string) => void;
};

const weekdayLabels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const formatDateLabel = (value: string): string => {
  return formatDate(value) || "Select date";
};

const getMonthDays = (monthDate: Date): Array<Date | null> => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mondayFirstOffset = (firstDay.getDay() + 6) % 7;
  const days: Array<Date | null> = Array.from({ length: mondayFirstOffset }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(year, month, day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
};

const isOutsideRange = (value: string, min?: string, max?: string): boolean => {
  return Boolean((min && value < min) || (max && value > max));
};

export const DateField = ({ className, disabled, label, max, min, onValueChange, value }: DateFieldProps) => {
  const selectedDate = parseDateInputValue(value);
  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate ?? new Date());
  const monthDays = useMemo(() => getMonthDays(visibleMonth), [visibleMonth]);
  const monthLabel = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric"
  }).format(visibleMonth);

  const moveMonth = (delta: number) => {
    setVisibleMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  return (
    <label className={cn("grid gap-1.5 text-sm font-semibold text-foreground", className)}>
      <span>{label}</span>
      <Popover.Root>
        <Popover.Trigger
          className="inline-flex min-h-[42px] w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 py-2 text-left text-foreground shadow-sm transition hover:border-ring/60 focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
          type="button"
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            <CalendarDays className="h-4 w-4 flex-none text-muted-foreground" aria-hidden="true" />
            <span className="truncate">{formatDateLabel(value)}</span>
          </span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            className="z-50 w-[292px] rounded-md border border-border bg-card p-3 text-card-foreground shadow-floating"
            sideOffset={6}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                type="button"
                onClick={() => moveMonth(-1)}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <strong className="text-sm">{monthLabel}</strong>
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                type="button"
                onClick={() => moveMonth(1)}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground">
              {weekdayLabels.map((weekday) => (
                <span className="py-1" key={weekday}>
                  {weekday}
                </span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {monthDays.map((date, index) => {
                if (!date) {
                  return <span aria-hidden="true" key={`empty-${index}`} />;
                }

                const nextValue = toDateInputValue(date);
                const isSelected = nextValue === value;
                const isToday = nextValue === toDateInputValue(new Date());
                const isDisabled = isOutsideRange(nextValue, min, max);

                return (
                  <Popover.Close asChild key={nextValue}>
                    <button
                      className={cn(
                        "inline-flex h-9 items-center justify-center rounded-md text-sm transition",
                        isSelected
                          ? "bg-primary font-bold text-primary-foreground"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground",
                        isToday && !isSelected && "ring-1 ring-ring",
                        isDisabled && "pointer-events-none opacity-35"
                      )}
                      disabled={isDisabled}
                      type="button"
                      onClick={() => onValueChange(nextValue)}
                    >
                      {date.getDate()}
                    </button>
                  </Popover.Close>
                );
              })}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </label>
  );
};
