import { cn } from "../../lib/utils/cn";

type StateMessageProps = {
  title: string;
  description?: string;
  tone?: "neutral" | "error" | "success";
};

const toneClassName: Record<NonNullable<StateMessageProps["tone"]>, string> = {
  neutral: "border-border bg-muted/60",
  error: "border-red-200 bg-red-50",
  success: "border-emerald-200 bg-emerald-50"
};

export const StateMessage = ({ title, description, tone = "neutral" }: StateMessageProps) => {
  return (
    <div className={cn("grid gap-1 rounded-md border p-3", toneClassName[tone])}>
      <strong>{title}</strong>
      {description ? <span className="text-muted-foreground">{description}</span> : null}
    </div>
  );
};
