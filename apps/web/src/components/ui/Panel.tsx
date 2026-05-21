import type { ReactNode } from "react";
import { cn } from "../../lib/utils/cn";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export const Panel = ({ children, className }: PanelProps) => {
  return (
    <section className={cn("rounded-md border border-border bg-card p-[18px] text-card-foreground shadow-panel", className)}>
      {children}
    </section>
  );
};
