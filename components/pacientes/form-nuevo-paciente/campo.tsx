import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CampoProps {
  label: string;
  htmlFor?: string;
  error?: string;
  requerido?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Envoltura label + control + mensaje de error para formularios. */
export function Campo({
  label,
  htmlFor,
  error,
  requerido,
  className,
  children,
}: CampoProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {requerido && <span className="ml-0.5 text-luda-rosa">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
    </div>
  );
}
