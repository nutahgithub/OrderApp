import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "../../lib/utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, id, className = "", ...props }, ref) => {
  const inputId = id ?? props.name;

  return (
    <label className={cn("grid gap-1.5 text-sm font-semibold text-foreground", className)} htmlFor={inputId}>
      <span>{label}</span>
      <input
        id={inputId}
        className="min-h-[42px] w-full rounded-md border border-input bg-card px-3 py-2 text-foreground shadow-sm transition placeholder:text-muted-foreground/70 hover:border-ring/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
        ref={ref}
        {...props}
      />
    </label>
  );
});

Input.displayName = "Input";
