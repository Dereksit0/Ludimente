import * as React from "react";

import { cn } from "@/lib/utils";

/** Card base de Ludimente con sombra suave lila y bordes redondeados. */
const LudaCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-luda-lila/15 bg-white shadow-luda",
      className,
    )}
    {...props}
  />
));
LudaCard.displayName = "LudaCard";

const LudaCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-1 p-6", className)} {...props} />
));
LudaCardHeader.displayName = "LudaCardHeader";

const LudaCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-bold text-luda-gris", className)}
    {...props}
  />
));
LudaCardTitle.displayName = "LudaCardTitle";

const LudaCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
LudaCardContent.displayName = "LudaCardContent";

export { LudaCard, LudaCardHeader, LudaCardTitle, LudaCardContent };
