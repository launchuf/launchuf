import { useId, type ReactNode } from "react";
import { Label } from "@/components/ui/label";

/** Etikett + hjälptext + felmeddelande, korrekt kopplat för skärmläsare. */
export function FormField({
  label, error, hint, required, children,
}: {
  label: string;
  error?: string | undefined;
  hint?: string;
  required?: boolean;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby": string | undefined }) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = [hint ? hintId : null, error ? errId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}{required && <span className="text-primary" aria-hidden="true"> *</span>}
        {required && <span className="sr-only"> (obligatoriskt)</span>}
      </Label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {hint && <p id={hintId} className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={errId} role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
