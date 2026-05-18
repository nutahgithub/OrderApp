import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export const Input = ({ label, id, className = "", ...props }: InputProps) => {
  const inputId = id ?? props.name;

  return (
    <label className={cn("grid gap-1.5 text-sm font-semibold text-foreground", className)} htmlFor={inputId}>
      <span>{label}</span>
      <input
        id={inputId}
        className="min-h-[42px] w-full rounded-md border border-input bg-card px-2.5 py-2 text-foreground"
        {...props}
      />
    </label>
  );
};
