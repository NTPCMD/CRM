import * as React from "react";
import { cn, colorFor, initials } from "@/lib/utils";

/* ---------- Button ---------- */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost";
  size?: "sm" | "md";
};
export function Button({ variant = "default", size = "md", className, ...p }: BtnProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 rounded-[9px] font-semibold whitespace-nowrap transition-colors cursor-pointer",
        size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-[13px]",
        variant === "primary" && "bg-primary text-white border border-primary hover:brightness-110",
        variant === "default" && "bg-card text-text border border-borderStrong hover:border-faint",
        variant === "ghost" && "bg-transparent text-muted border border-transparent hover:bg-card hover:text-text",
        className,
      )}
      {...p}
    />
  );
}

/* ---------- Card ---------- */
export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("bg-card border border-border rounded shadow-card", className)}>{children}</div>
  );
}
export function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border">
      <h3 className="text-sm font-semibold m-0">{title}</h3>
      <div className="flex-1" />
      {action}
    </div>
  );
}
export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-4", className)}>{children}</div>;
}

/* ---------- Pill ---------- */
const TONES: Record<string, string> = {
  green: "text-success bg-[var(--success-soft)]",
  amber: "text-warning bg-[var(--warning-soft)]",
  red: "text-danger bg-[var(--danger-soft)]",
  blue: "text-primary bg-primarySoft",
  violet: "text-violet bg-[var(--violet-soft)]",
  grey: "text-muted bg-card2",
};
export function Pill({ tone = "grey", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-[3px] rounded-full", TONES[tone])}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
export function statusTone(status: string): keyof typeof TONES {
  const s = status.toLowerCase();
  if (["active", "paid", "signed", "on track", "won", "done"].some((x) => s.includes(x))) return "green";
  if (["overdue", "off track", "lost", "urgent"].some((x) => s.includes(x))) return "red";
  if (["draft", "archived"].some((x) => s.includes(x))) return "grey";
  if (["sent", "in progress", "active"].some((x) => s.includes(x))) return "blue";
  return "amber";
}

/* ---------- Avatar ---------- */
export function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  return (
    <span
      className="rounded-full grid place-items-center text-white font-bold flex-none"
      style={{ width: size, height: size, fontSize: size * 0.38, background: colorFor(name) }}
    >
      {initials(name || "?")}
    </span>
  );
}

/* ---------- KPI ---------- */
export function Kpi({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded p-4 shadow-card">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-[26px] font-bold tracking-tight mt-2 num">{value}</div>
      {sub && <div className="text-xs text-muted mt-1.5">{sub}</div>}
    </div>
  );
}

/* ---------- Page header ---------- */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-end gap-3.5 mb-5 flex-wrap">
      <div>
        <h1 className="text-2xl m-0 tracking-tight text-balance">{title}</h1>
        {subtitle && <p className="mt-1 mb-0 text-muted text-[13.5px]">{subtitle}</p>}
      </div>
      <div className="flex-1" />
      {actions}
    </div>
  );
}

/* ---------- Empty state ---------- */
export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center py-14 px-5">
      <div className="text-[15px] text-text font-semibold mb-1">{title}</div>
      {hint && <div className="text-[13px] text-faint max-w-md mx-auto">{hint}</div>}
    </div>
  );
}

/* ---------- Progress ---------- */
export function Progress({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 rounded-full bg-card2 overflow-hidden min-w-[80px] flex-1">
        <div className="h-full bg-primary rounded-full" style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs num text-muted">{value}%</span>
    </div>
  );
}

/* ---------- Table ---------- */
export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} className="text-left text-[11px] tracking-wide uppercase text-faint font-semibold pb-2.5 px-3.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
