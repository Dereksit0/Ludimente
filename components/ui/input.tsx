import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-xl border border-luda-lila/30 bg-white px-4 py-2 text-sm text-luda-gris shadow-sm transition-colors",
          "placeholder:text-luda-gris-light",
          "focus-visible:outline-none focus-visible:border-luda-lila focus-visible:ring-2 focus-visible:ring-luda-lila/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
