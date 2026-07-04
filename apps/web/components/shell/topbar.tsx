"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { createClient } from "@/lib/supabase/client";

export function Topbar({ user }: { user: { color: string; initials: string } }) {
  const router = useRouter();

  function toggleTheme() {
    const root = document.documentElement;
    const cur = root.getAttribute("data-theme");
    const isDark = cur ? cur === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    const next = isDark ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center gap-3.5 px-4 border-b border-border bg-surface" style={{ gridArea: "top" }}>
      <button
        className="flex-1 max-w-[520px] flex items-center gap-2 bg-bg border border-border rounded-[9px] px-3 py-2 text-muted hover:border-borderStrong"
        type="button"
      >
        <Icon name="Search" className="w-4 h-4" />
        <span className="text-sm">Search projects, clients, invoices…</span>
        <kbd className="ml-auto font-mono text-[11px] text-faint border border-border rounded px-1.5">⌘K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-1.5">
        <button onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme"
          className="w-9 h-9 rounded-[9px] grid place-items-center text-muted hover:bg-card hover:text-text">
          <Icon name="Moon" className="w-[18px] h-[18px]" />
        </button>
        <button title="Notifications" aria-label="Notifications"
          className="w-9 h-9 rounded-[9px] grid place-items-center text-muted hover:bg-card hover:text-text relative">
          <Icon name="Bell" className="w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-2 w-[7px] h-[7px] rounded-full bg-danger border-2 border-surface" />
        </button>
        <button onClick={signOut} title="Sign out" aria-label="Sign out"
          className="w-9 h-9 rounded-[9px] grid place-items-center text-muted hover:bg-card hover:text-text">
          <Icon name="LogOut" className="w-[17px] h-[17px]" />
        </button>
        <span className="rounded-full grid place-items-center text-white font-bold w-8 h-8 text-xs"
          style={{ background: user.color }}>
          {user.initials}
        </span>
      </div>
    </header>
  );
}
