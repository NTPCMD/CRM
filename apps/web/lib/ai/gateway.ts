/**
 * Provider-agnostic AI Gateway (Volume 4 §8). The application never calls a
 * model provider directly — it calls the gateway, which routes to the
 * configured provider (default: Anthropic / latest Claude). Swap providers by
 * changing env, not application code.
 */

export interface CompleteOptions {
  system: string;
  prompt: string;
  maxTokens?: number;
}

export interface AiProvider {
  readonly name: string;
  readonly model: string;
  complete(opts: CompleteOptions): Promise<string>;
}

class AnthropicProvider implements AiProvider {
  readonly name = "anthropic";
  readonly model = process.env.AI_MODEL || "claude-sonnet-5";
  constructor(private apiKey: string) {}

  async complete({ system, prompt, maxTokens = 700 }: CompleteOptions): Promise<string> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AI provider error (${res.status}): ${text.slice(0, 300)}`);
    }
    const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    return (json.content ?? []).filter((c) => c.type === "text").map((c) => c.text).join("").trim();
  }
}

/** Returns the configured provider, or null if no provider key is set. */
export function getGateway(): AiProvider | null {
  const anthropic = process.env.ANTHROPIC_API_KEY;
  if (anthropic) return new AnthropicProvider(anthropic);
  // Future: OpenAI / Google providers keyed off their env vars, same interface.
  return null;
}
