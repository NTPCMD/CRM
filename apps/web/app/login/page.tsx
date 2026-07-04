"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    const supabase = createClient();
    try {
      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${location.origin}/auth/callback?next=${next}` },
        });
        if (error) throw error;
        setMsg("Check your email for a magic link to sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(next);
        router.refresh();
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: "google" | "azure") {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback?next=${next}` },
    });
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="flex items-center gap-2.5 mb-7 justify-center">
          <div className="w-8 h-8 rounded-lg grid place-items-center text-white font-extrabold"
            style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>A</div>
          <b className="text-lg tracking-tight">AgencyOS</b>
        </div>
        <div className="bg-card border border-border rounded shadow-card p-6">
          <h1 className="text-xl m-0 mb-1 text-center tracking-tight">Welcome back</h1>
          <p className="text-center text-muted text-[13px] mt-0 mb-5">Sign in to your workspace</p>

          {!hasSupabaseEnv && (
            <div className="mb-4 text-[12px] text-warning bg-[var(--warning-soft)] rounded-lg p-3">
              Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and
              NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in <code>.env.local</code>.
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={() => oauth("google")} className="border border-borderStrong bg-card rounded-[9px] py-2 text-[13px] font-semibold hover:border-faint">Google</button>
            <button onClick={() => oauth("azure")} className="border border-borderStrong bg-card rounded-[9px] py-2 text-[13px] font-semibold hover:border-faint">Microsoft</button>
          </div>
          <div className="flex items-center gap-3 my-4 text-faint text-[11px]">
            <div className="flex-1 h-px bg-border" /> OR <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={submit} className="grid gap-3">
            <input type="email" required placeholder="you@agency.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-bg border border-border rounded-[9px] px-3 py-2.5 text-sm outline-none focus:border-primary" />
            {mode === "password" && (
              <input type="password" required placeholder="Password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-bg border border-border rounded-[9px] px-3 py-2.5 text-sm outline-none focus:border-primary" />
            )}
            {err && <div className="text-[12px] text-danger">{err}</div>}
            {msg && <div className="text-[12px] text-success">{msg}</div>}
            <button type="submit" disabled={busy}
              className="bg-primary text-white rounded-[9px] py-2.5 text-sm font-semibold hover:brightness-110 disabled:opacity-60">
              {busy ? "…" : mode === "magic" ? "Send magic link" : "Sign in"}
            </button>
          </form>

          <button onClick={() => setMode(mode === "password" ? "magic" : "password")}
            className="w-full text-center text-[12px] text-primary mt-3">
            {mode === "password" ? "Email me a magic link instead" : "Use a password instead"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
