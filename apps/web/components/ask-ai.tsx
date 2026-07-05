"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function AskAi() {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function ask() {
    if (!q.trim()) return;
    setBusy(true);
    setErr(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const json = await res.json();
      if (!json.success) setErr(json.error?.message ?? "Something went wrong.");
      else setAnswer(json.data.answer);
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {answer && <div className="text-[13px] leading-relaxed mb-3 whitespace-pre-wrap">{answer}</div>}
      {err && <div className="text-[12px] text-warning mb-3">{err}</div>}
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="Ask about your business…"
          className="flex-1 bg-bg border border-border rounded-[9px] px-3 py-2 text-[13px] outline-none focus:border-primary"
        />
        <Button variant="primary" onClick={ask} disabled={busy}>{busy ? "…" : "Ask"}</Button>
      </div>
    </div>
  );
}
