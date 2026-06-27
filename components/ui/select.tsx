import * as React from "react";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

/** Select nativo estilizado con la marca Ludimente. */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex h-11 w-full appearance-none rounded-xl border border-luda-lila/30 bg-white px-4 pr-10 text-sm text-luda-gris shadow-sm transition-colors",
            "focus-visible:outline-none focus-visible:border-luda-lila focus-visible:ring-2 focus-visible:ring-luda-lila/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-luda-gris-light" />
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };
