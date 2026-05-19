import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "../../lib/utils/cn";

type StateMessageProps = {
  title: string;
  description?: string;
  tone?: "neutral" | "error" | "success";
  action?: ReactNode;
};

const toneClassName: Record<NonNullable<StateMessageProps["tone"]>, string> = {
  neutral: "border-border bg-muted/60 text-foreground",
  error: "border-red-200 bg-red-50 text-red-950",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950"
};

const iconByTone = {
  neutral: Info,
  error: AlertCircle,
  success: CheckCircle2
};

export const StateMessage = ({ title, description, tone = "neutral", action }: StateMessageProps) => {
  const Icon = iconByTone[tone];

  return (
    <div className={cn("flex gap-3 rounded-md border p-3 shadow-sm max-[780px]:items-start", toneClassName[tone])}>
      <Icon className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
      <div className="grid min-w-0 flex-1 gap-2">
        <strong>{title}</strong>
        {description ? <span className="break-words text-sm leading-normal opacity-80">{description}</span> : null}
        {action ? <div className="pt-1">{action}</div> : null}
      </div>
    </div>
  );
};
