import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export const Button = ({ children, className = "", ...props }: ButtonProps) => {
  return (
    <button
      className={cn(
        "min-h-[42px] cursor-pointer rounded-md border-0 bg-primary px-3.5 py-2 font-bold text-primary-foreground hover:brightness-[0.97] disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
