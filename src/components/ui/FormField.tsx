import { InputHTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";

export function Label({ className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`mb-1.5 block text-sm font-semibold text-slate-800 ${className}`}
      {...props}
    />
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
}

export function Input({ className = "", icon, ...props }: InputProps) {
  const input = (
    <input
      className={`block w-full rounded-md border border-slate-300 bg-white py-2 text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 ${
        icon ? "pl-9 pr-3" : "px-3"
      } ${className}`}
      {...props}
    />
  );

  if (!icon) return input;

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
        {icon}
      </span>
      {input}
    </div>
  );
}

interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}

export function FormField({ label, htmlFor, required, hint, children }: FormFieldProps) {
  return (
    <div>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-rose-600 font-bold">*</span>}
      </Label>
      {children}
      {hint && <p className="mt-1 text-xs font-medium text-slate-600">{hint}</p>}
    </div>
  );
}
