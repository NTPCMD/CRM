// generate-ai-response — provider-agnostic AI completion (Volume 4 §8/§9).
// Deploy: supabase functions deploy generate-ai-response
//
// Mirrors the app's AI Gateway: the application sends a system + prompt and the
// function routes to the configured provider (default Anthropic / Claude).
// Secrets are read from Deno.env and never returned to the caller.

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

async function anthropic(system: string, prompt: string, apiKey: string) {
  const model = Deno.env.get("AI_MODEL") ?? "claude-sonnet-5";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model, max_tokens: 700, system, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`provider ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data: any = await res.json();
  return { model, text: (data.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("").trim() };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ success: false, error: { code: "method", message: "POST only" } }, 405);

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return json({ success: false, error: { code: "ai_not_configured", message: "ANTHROPIC_API_KEY not set" } }, 503);

  let body: { system?: string; prompt?: string };
  try {
    body = await req.json();
  } catch {
    return json({ success: false, error: { code: "invalid_body", message: "Expected JSON" } }, 400);
  }
  if (!body.prompt) return json({ success: false, error: { code: "validation", message: "prompt required" } }, 400);

  try {
    const out = await anthropic(body.system ?? "You are the AgencyOS assistant.", body.prompt, key);
    return json({ success: true, data: out });
  } catch (e) {
    return json({ success: false, error: { code: "ai_error", message: String(e) } }, 502);
  }
});
