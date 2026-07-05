"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { sendMessageAction } from "@/app/(app)/messages/actions";

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  function send() {
    if (!body.trim()) return;
    const text = body;
    setBody("");
    start(async () => {
      const res = await sendMessageAction(conversationId, text);
      if (res?.error) setBody(text);
      else router.refresh();
    });
  }

  return (
    <div className="p-3 border-t border-border flex gap-2.5">
      <input
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
        placeholder="Write a message…"
        className="flex-1 bg-bg border border-border rounded-[10px] px-3 py-2.5 text-[13px] outline-none focus:border-primary"
      />
      <Button variant="primary" onClick={send} disabled={pending || !body.trim()}>
        {pending ? "…" : "Send"}
      </Button>
    </div>
  );
}
