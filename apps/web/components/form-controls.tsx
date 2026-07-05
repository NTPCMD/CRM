import * as React from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full bg-bg border border-border rounded-[9px] px-3 py-2.5 text-[13px] outline-none focus:border-primary text-text";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3.5">
      <span className="block text-[12px] text-muted font-semibold mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...p }, ref) {
    return <input ref={ref} className={cn(base, className)} {...p} />;
  },
);

export function Select({ className, children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(base, className)} {...p}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(base, "min-h-[80px] resize-y", className)} {...p} />;
}

export function FormError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <div className="text-[12px] text-danger mb-3">{children}</div>;
}
