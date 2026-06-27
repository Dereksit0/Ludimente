import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[88px] w-full rounded-xl border border-luda-lila/30 bg-white px-4 py-2.5 text-sm text-luda-gris shadow-sm transition-colors",
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
Textarea.displayName = "Textarea";

export { Textarea };
