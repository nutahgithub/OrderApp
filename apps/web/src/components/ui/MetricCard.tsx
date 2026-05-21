import type { ReactNode } from "react";
import { cn } from "../../lib/utils/cn";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  supportingText?: ReactNode;
  accent?: "primary" | "success" | "warning" | "info";
};

const accentClassName: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info"
};

export const MetricCard = ({ label, value, supportingText, accent = "primary" }: MetricCardProps) => {
  return (
    <section className="relative grid min-h-[136px] gap-2 overflow-hidden rounded-md border border-border bg-card p-[18px] text-card-foreground shadow-panel">
      <span className={cn("absolute inset-y-0 left-0 w-1", accentClassName[accent])} aria-hidden="true" />
      <span className="pl-1 text-xs font-extrabold uppercase tracking-normal text-muted-foreground">{label}</span>
      <strong className="min-w-0 break-words pl-1 text-[26px] leading-tight text-primary">{value}</strong>
      {supportingText ? <small className="self-end break-words pl-1 text-[13px] leading-normal text-muted-foreground">{supportingText}</small> : null}
    </section>
  );
};
