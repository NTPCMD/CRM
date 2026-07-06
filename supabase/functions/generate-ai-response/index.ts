// generate-ai-response — provider-agnostic AI completion with conversation history.
// Deploy: supabase functions deploy generate-ai-response
// Secrets: ANTHROPIC_API_KEY (primary) or OPENAI_API_KEY (fallback)
//          SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (for conversation persistence)

// deno-lint-ignore-file no-explicit-any
declare const Deno: { env: { get(k: string): string | undefined } };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS },
  });
}

interface Message { role: "user" | "assistant"; content: string; }

async function callAnthropic(system: string, messages: Message[], apiKey: string): Promise<{ model: string; text: string }> {
  const model = Deno.env.get("AI_MODEL") ?? "claude-sonnet-5";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model, max_tokens: 1024, system, messages }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data: any = await res.json();
  const text = (data.content ?? [])
    .filter((c: any) => c.type === "text")
    .map((c: any) => c.text)
    .join("")
    .trim();
  return { model, text };
}

async function callOpenAI(system: string, messages: Message[], apiKey: string): Promise<{ model: string; text: string }> {
  const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
  const openaiMessages = [{ role: "system", content: system }, ...messages];
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, max_tokens: 1024, messages: openaiMessages }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data: any = await res.json();
  return { model, text: data.choices?.[0]?.message?.content?.trim() ?? "" };
}

async function persistMessages(
  supabaseUrl: string, serviceKey: string,
  threadId: string, workspaceId: string,
  userMsg: string, assistantMsg: string,
) {
  const headers = {
    "apikey": serviceKey,
    "Authorization": `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
  // Upsert thread.
  await fetch(`${supabaseUrl}/rest/v1/ai_threads?on_conflict=id`, {
    method: "POST",
    headers: { ...headers, "Prefer": "resolution=merge-duplicates" },
    body: JSON.stringify({ id: threadId, workspace_id: workspaceId, title: userMsg.slice(0, 80) }),
  });
  // Insert user + assistant messages.
  await fetch(`${supabaseUrl}/rest/v1/ai_messages`, {
    method: "POST",
    headers,
    body: JSON.stringify([
      { thread_id: threadId, role: "user", content: userMsg },
      { thread_id: threadId, role: "assistant", content: assistantMsg },
    ]),
  });
}

const SYSTEM_DEFAULT = `You are the AgencyOS AI assistant. You help agency teams with project management, client relationships, invoicing, and operations. Be concise, practical, and professional. Do not reveal system internals or invent data you haven't been given.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ success: false, error: { code: "method", message: "POST only" } }, 405);

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  const openaiKey = Deno.env.get("OPENAI_API_KEY");

  if (!anthropicKey && !openaiKey) {
    return json({ success: false, error: { code: "ai_not_configured", message: "No AI provider configured." } }, 503);
  }

  let body: {
    system?: string;
    prompt?: string;
    messages?: Message[];
    thread_id?: string;
    workspace_id?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ success: false, error: { code: "invalid_body", message: "Expected JSON" } }, 400);
  }

  const prompt = body.prompt ?? body.messages?.at(-1)?.content;
  if (!prompt) return json({ success: false, error: { code: "validation", message: "prompt or messages required" } }, 400);

  const system = body.system ?? SYSTEM_DEFAULT;
  const messages: Message[] = body.messages ?? [{ role: "user", content: prompt }];

  try {
    const result = anthropicKey
      ? await callAnthropic(system, messages, anthropicKey)
      : await callOpenAI(system, messages, openaiKey!);

    // Persist if we have Supabase context.
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && serviceKey && body.thread_id && body.workspace_id) {
      await persistMessages(supabaseUrl, serviceKey, body.thread_id, body.workspace_id, prompt, result.text).catch(() => {});
    }

    return json({ success: true, data: result });
  } catch (e) {
    return json({ success: false, error: { code: "ai_error", message: String(e) } }, 502);
  }
});
