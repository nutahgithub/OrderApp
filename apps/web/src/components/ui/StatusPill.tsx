import type { ReactNode } from "react";
import { statusPillClassName } from "../../lib/theme/status-colors";
import { cn } from "../../lib/utils/cn";

type StatusPillProps = {
  children: ReactNode;
  className?: string;
};

export const StatusPill = ({ children, className }: StatusPillProps) => {
  return <span className={cn(statusPillClassName, className)}>{children}</span>;
};
