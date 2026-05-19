import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils/cn";

export type SelectOption = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  label: string;
  options: SelectOption[];
  value: string;
  disabled?: boolean;
  className?: string;
  onValueChange: (value: string) => void;
};

export const SelectField = ({ className, disabled, label, onValueChange, options, value }: SelectFieldProps) => {
  return (
    <label className={cn("grid gap-1.5 text-sm font-semibold text-foreground", className)}>
      <span>{label}</span>
      <Select.Root disabled={disabled} value={value} onValueChange={onValueChange}>
        <Select.Trigger className="inline-flex min-h-[42px] w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 py-2 text-left text-foreground shadow-sm transition hover:border-ring/60 focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60">
          <Select.Value />
          <Select.Icon>
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="z-50 overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-floating">
            <Select.Viewport className="p-1">
              {options.map((option) => (
                <Select.Item
                  className="relative flex min-h-9 cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-3 text-sm outline-none hover:bg-accent focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  key={option.value}
                  value={option.value}
                >
                  <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </Select.ItemIndicator>
                  <Select.ItemText>{option.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </label>
  );
};
