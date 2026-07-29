import React from "react";
import { cn } from "@/lib/cn";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

const fieldBaseClasses =
  "w-full bg-surface-1 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors disabled:opacity-50";

function FieldChrome({ label, error, hint, required, children }: FieldWrapperProps & { children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-[11px] text-text-muted uppercase tracking-wider font-semibold">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = FieldWrapperProps & React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, className, ...props }, ref) => (
    <FieldChrome label={label} error={error} hint={hint} required={required}>
      <input ref={ref} className={cn(fieldBaseClasses, error && "border-danger/50 focus:border-danger focus:ring-danger/20", className)} {...props} />
    </FieldChrome>
  )
);
Input.displayName = "Input";

type TextareaProps = FieldWrapperProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, className, ...props }, ref) => (
    <FieldChrome label={label} error={error} hint={hint} required={required}>
      <textarea ref={ref} className={cn(fieldBaseClasses, "resize-none", error && "border-danger/50 focus:border-danger focus:ring-danger/20", className)} {...props} />
    </FieldChrome>
  )
);
Textarea.displayName = "Textarea";

type SelectProps = FieldWrapperProps & React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, className, children, ...props }, ref) => (
    <FieldChrome label={label} error={error} hint={hint} required={required}>
      <select ref={ref} className={cn(fieldBaseClasses, "appearance-none", error && "border-danger/50 focus:border-danger focus:ring-danger/20", className)} {...props}>
        {children}
      </select>
    </FieldChrome>
  )
);
Select.displayName = "Select";

export default Input;
