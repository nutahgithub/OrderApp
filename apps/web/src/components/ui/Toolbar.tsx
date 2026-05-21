import type { ReactNode } from "react";
import { cn } from "../../lib/utils/cn";

type ToolbarProps = {
  children: ReactNode;
  className?: string;
};

export const Toolbar = ({ children, className }: ToolbarProps) => {
  return (
    <section
      className={cn(
        "grid items-end gap-3 rounded-md border border-border bg-card p-[18px] text-card-foreground shadow-panel max-[780px]:grid-cols-1 max-[780px]:items-stretch",
        className
      )}
    >
      {children}
    </section>
  );
};
