"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Ensure a profile row exists for the signed-in user (first login).
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) {
        router.replace("/login");
        return;
      }
      await supabase.from("profiles").upsert(
        { id: u.id, email: u.email, first_name: (u.user_metadata?.name as string) ?? null },
        { onConflict: "id", ignoreDuplicates: true },
      );
    })();
  }, [router]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("create_workspace", { p_name: name });
    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-[420px] bg-card border border-border rounded shadow-card p-6">
        <h1 className="text-xl m-0 mb-1 tracking-tight">Create your workspace</h1>
        <p className="text-muted text-[13px] mt-0 mb-5">
          A workspace holds your clients, projects, and team. You'll be its owner.
        </p>
        <form onSubmit={create} className="grid gap-3">
          <label className="text-[12px] text-muted font-semibold">Workspace name</label>
          <input required autoFocus placeholder="Northwind Studio" value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-bg border border-border rounded-[9px] px-3 py-2.5 text-sm outline-none focus:border-primary" />
          {err && <div className="text-[12px] text-danger">{err}</div>}
          <button type="submit" disabled={busy || !name}
            className="bg-primary text-white rounded-[9px] py-2.5 text-sm font-semibold hover:brightness-110 disabled:opacity-60">
            {busy ? "Creating…" : "Create workspace"}
          </button>
        </form>
      </div>
    </div>
  );
}
