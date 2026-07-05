import { getContext } from "@/lib/session";
import { dashboardStats, listProjects } from "@/lib/queries";
import { getGateway } from "@/lib/ai/gateway";
import { ok, fail, UNAUTHORIZED } from "@/lib/api/respond";

export async function POST(request: Request) {
  const ctx = await getContext();
  if (!ctx) return UNAUTHORIZED();

  const gateway = getGateway();
  if (!gateway) {
    return fail("ai_not_configured", "Set ANTHROPIC_API_KEY to enable the AI assistant.", 503);
  }

  let body: { question?: string };
  try {
    body = await request.json();
  } catch {
    return fail("invalid_body", "Expected a JSON body with a 'question'.");
  }
  const question = body.question?.trim();
  if (!question) return fail("validation", "A question is required.");

  // Context is built ONLY from data this user is permitted to see (all queries
  // run under RLS), so the assistant can never surface unauthorized data.
  const [stats, projects] = await Promise.all([dashboardStats(), listProjects()]);
  const context = [
    `Workspace: ${ctx.workspace?.name ?? "unknown"}. Role: ${ctx.roleKey ?? "member"}.`,
    `Counts — clients: ${stats.clients}, active projects: ${stats.projects}, open invoices: ${stats.openInvoices}, tasks in flight: ${stats.tasksDue}.`,
    projects.length
      ? `Projects: ${projects.slice(0, 15).map((p) => `${p.name} (${p.status}, health ${p.health_score ?? "?"})`).join("; ")}.`
      : "No projects yet.",
  ].join("\n");

  const system =
    "You are the AgencyOS assistant for a digital agency. Answer concisely and " +
    "practically using ONLY the provided workspace context. If the context is " +
    "insufficient, say what additional data you'd need. Never invent figures.";

  try {
    const answer = await gateway.complete({ system, prompt: `Context:\n${context}\n\nQuestion: ${question}` });
    return ok({ answer, model: gateway.model });
  } catch (e) {
    return fail("ai_error", e instanceof Error ? e.message : "AI request failed.", 502);
  }
}
