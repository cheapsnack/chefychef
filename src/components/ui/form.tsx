"use client";

/**
 * Lightweight shadcn-style Form primitives (FormItem / FormLabel /
 * FormControl / FormDescription / FormMessage) without the react-hook-form
 * dependency. Field state is passed explicitly via FormField context so
 * labels, inputs and error messages are wired together with proper ARIA ids.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface FormFieldContextValue {
  id: string;
  error?: string;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

function useFormField() {
  const ctx = React.useContext(FormFieldContext);
  if (!ctx) throw new Error("useFormField must be used inside <FormField>");
  return {
    id: ctx.id,
    error: ctx.error,
    formItemId: `${ctx.id}-form-item`,
    formDescriptionId: `${ctx.id}-form-item-description`,
    formMessageId: `${ctx.id}-form-item-message`,
  };
}

function FormField({ name, error, children }: { name: string; error?: string; children: React.ReactNode }) {
  const reactId = React.useId();
  const value = React.useMemo(() => ({ id: `${name}-${reactId}`, error }), [name, reactId, error]);
  return <FormFieldContext.Provider value={value}>{children}</FormFieldContext.Provider>;
}

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-2", className)} {...props} />
));
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();
  return <Label ref={ref} className={cn(error && "text-destructive", className)} htmlFor={formItemId} {...props} />;
});
FormLabel.displayName = "FormLabel";

/** Clones its single child, injecting id + aria attributes. */
function FormControl({ children }: { children: React.ReactElement<Record<string, unknown>> }) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  return React.cloneElement(children, {
    id: formItemId,
    "aria-describedby": error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId,
    "aria-invalid": !!error,
  });
}

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { formDescriptionId } = useFormField();
    return <p ref={ref} id={formDescriptionId} className={cn("text-[0.8rem] text-muted-foreground", className)} {...props} />;
  },
);
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { error, formMessageId } = useFormField();
    const body = error ?? children;
    if (!body) return null;
    return (
      <p ref={ref} id={formMessageId} className={cn("text-[0.8rem] font-medium text-destructive", className)} {...props}>
        {body}
      </p>
    );
  },
);
FormMessage.displayName = "FormMessage";

export { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, useFormField };
