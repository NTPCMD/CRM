"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/nav";

export function Sidebar({
  items,
  user,
  workspace,
}: {
  items: NavItem[];
  user: { name: string; role: string; color: string; initials: string };
  workspace: string;
}) {
  const pathname = usePathname();
  let lastGroup: string | undefined;

  return (
    <aside className="bg-surface border-r border-border flex flex-col overflow-hidden" style={{ gridArea: "side" }}>
      <nav className="flex-1 overflow-y-auto px-2.5 py-2 pb-5">
        {items.map((n) => {
          const active = pathname === n.href || pathname.startsWith(n.href + "/");
          const showGroup = n.group && n.group !== lastGroup;
          lastGroup = n.group ?? lastGroup;
          return (
            <div key={n.href}>
              {showGroup && (
                <div className="text-[10px] tracking-widest uppercase text-faint px-2 pt-3.5 pb-1.5">{n.group}</div>
              )}
              <Link
                href={n.href}
                className={cn(
                  "flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13.5px] font-medium mb-px",
                  active ? "bg-primarySoft text-primary" : "text-muted hover:bg-card hover:text-text",
                )}
              >
                <Icon name={n.icon} className="w-[17px] h-[17px] flex-none" />
                <span>{n.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="px-3 py-2.5 border-t border-border flex items-center gap-2.5">
        <span
          className="rounded-full grid place-items-center text-white font-bold flex-none w-8 h-8 text-xs"
          style={{ background: user.color }}
        >
          {user.initials}
        </span>
        <div className="min-w-0">
          <b className="block text-[12.5px] truncate">{user.name}</b>
          <span className="text-[11px] text-faint">
            {user.role} · {workspace}
          </span>
        </div>
      </div>
    </aside>
  );
}
