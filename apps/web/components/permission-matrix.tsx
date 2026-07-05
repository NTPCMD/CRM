"use client";

import { useState, useTransition } from "react";
import { PERMISSIONS } from "@/lib/permissions";
import { toggleRolePermissionAction } from "@/app/(app)/permissions/actions";
import { cn } from "@/lib/utils";

interface RoleData {
  id: string;
  key: string;
  name: string;
  grants_all: boolean;
  keys: Set<string>;
}

function Switch({ on, disabled, onToggle }: { on: boolean; disabled?: boolean; onToggle?: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "w-[38px] h-[22px] rounded-full border relative transition-colors",
        on ? "bg-primarySoft border-primary" : "bg-card2 border-border",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
      )}
    >
      <span
        className={cn("absolute top-[2px] w-4 h-4 rounded-full transition-all", on ? "left-[18px] bg-primary" : "left-[2px] bg-faint")}
      />
    </button>
  );
}

export function PermissionMatrix({ roles }: { roles: Array<{ id: string; key: string; name: string; grants_all: boolean; keys: string[] }> }) {
  const [state, setState] = useState<RoleData[]>(
    roles.map((r) => ({ ...r, keys: new Set(r.keys) })),
  );
  const [pending, start] = useTransition();

  function toggle(roleId: string, permKey: string) {
    setState((prev) =>
      prev.map((r) => {
        if (r.id !== roleId) return r;
        const keys = new Set(r.keys);
        const on = !keys.has(permKey);
        on ? keys.add(permKey) : keys.delete(permKey);
        start(async () => {
          const res = await toggleRolePermissionAction(roleId, permKey, on);
          if (res?.error) {
            // revert on failure
            setState((p2) =>
              p2.map((rr) => {
                if (rr.id !== roleId) return rr;
                const k = new Set(rr.keys);
                on ? k.delete(permKey) : k.add(permKey);
                return { ...rr, keys: k };
              }),
            );
          }
        });
        return { ...r, keys };
      }),
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className="text-left text-[11px] uppercase tracking-wide text-faint font-semibold pb-2.5 px-3.5">Capability</th>
            {state.map((r) => (
              <th key={r.id} className="text-center text-[11px] uppercase tracking-wide text-faint font-semibold pb-2.5 px-3.5">
                {r.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSIONS.map((perm) => (
            <tr key={perm} className="hover:bg-card2">
              <td className="px-3.5 py-2.5 border-t border-border font-mono text-[12px]">{perm}</td>
              {state.map((r) => (
                <td key={r.id} className="px-3.5 py-2.5 border-t border-border text-center">
                  <Switch
                    on={r.grants_all || r.keys.has(perm)}
                    disabled={r.grants_all || pending}
                    onToggle={() => toggle(r.id, perm)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
