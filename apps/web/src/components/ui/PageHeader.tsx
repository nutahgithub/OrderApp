import type { ReactNode } from "react";
import { cn } from "../../lib/utils/cn";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

export const PageHeader = ({ eyebrow, title, subtitle, actions, className }: PageHeaderProps) => {
  return (
    <header className={cn("flex items-start justify-between gap-4 max-[780px]:grid", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="mb-1.5 mt-0 text-xs font-bold uppercase tracking-normal text-muted-foreground">{eyebrow}</p> : null}
        <h1 className="m-0 break-words text-[28px] leading-tight text-foreground max-[780px]:text-2xl">{title}</h1>
        {subtitle ? <p className="mb-0 mt-2 max-w-3xl text-sm leading-normal text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-none flex-wrap items-center justify-end gap-2 max-[780px]:justify-start">{actions}</div> : null}
    </header>
  );
};
