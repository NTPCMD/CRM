"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui";
import { cn } from "@/lib/utils";

export function Modal({
  label,
  title,
  variant = "primary",
  size = "sm",
  children,
}: {
  label: React.ReactNode;
  title: string;
  variant?: "primary" | "default" | "ghost";
  size?: "sm" | "md";
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        {label}
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
          style={{ background: "rgba(3,7,18,.6)", backdropFilter: "blur(3px)" }}
          onClick={close}
        >
          <div
            className={cn(
              "w-full bg-surface border border-borderStrong rounded-[14px] shadow-card overflow-hidden",
              size === "sm" ? "max-w-[440px]" : "max-w-[640px]",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center px-5 py-3.5 border-b border-border">
              <h3 className="text-[15px] font-semibold m-0">{title}</h3>
              <button
                onClick={close}
                aria-label="Close"
                className="ml-auto w-7 h-7 grid place-items-center rounded-lg text-muted hover:bg-card hover:text-text"
              >
                ✕
              </button>
            </header>
            <div className="p-5">{children(close)}</div>
          </div>
        </div>
      )}
    </>
  );
}
