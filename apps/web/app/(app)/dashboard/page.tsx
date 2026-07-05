import Link from "next/link";
import { getContext } from "@/lib/session";
import { dashboardStats, listProjects, listActivity } from "@/lib/queries";
import { Card, CardHeader, CardBody, Kpi, PageHeader, Table, Pill, Progress, Empty, Button } from "@/components/ui";
import { Icon } from "@/components/icon";
import { healthPill } from "@/lib/health";
import { money, timeAgo } from "@/lib/utils";
import { AskAi } from "@/components/ask-ai";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await getContext();
  const [stats, projects, activity] = await Promise.all([
    dashboardStats(),
    listProjects(),
    listActivity(6),
  ]);
  const first = ctx?.profile?.first_name ?? "there";

  return (
    <>
      <PageHeader
        title={`Good afternoon, ${first}`}
        subtitle={`Here's how ${ctx?.workspace?.name ?? "your workspace"} is tracking today.`}
        actions={
          <Link href="/projects">
            <Button variant="primary"><Icon name="Plus" className="w-4 h-4" /> New project</Button>
          </Link>
        }
      />

      <div className="grid gap-3.5 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
        <Kpi label="Active projects" value={stats.projects} />
        <Kpi label="Clients" value={stats.clients} />
        <Kpi label="Open invoices" value={stats.openInvoices} />
        <Kpi label="Tasks in flight" value={stats.tasksDue} />
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
        <div className="grid gap-4 content-start">
          <Card>
            <CardHeader title="Active projects" action={<Link href="/projects" className="text-xs text-primary">View all</Link>} />
            <CardBody className="pt-1.5">
              {projects.length ? (
                <Table head={["Project", "Progress", "Health", "Due"]}>
                  {projects.map((p) => {
                    const h = healthPill(p.health_score);
                    return (
                      <tr key={p.id} className="hover:bg-card2">
                        <td className="px-3.5 py-3 border-t border-border">
                          <Link href={`/projects/${p.id}`} className="font-semibold hover:text-primary">{p.name}</Link>
                        </td>
                        <td className="px-3.5 py-3 border-t border-border w-[180px]">
                          <Progress value={Math.max(0, Math.min(100, p.health_score ?? 0))} />
                        </td>
                        <td className="px-3.5 py-3 border-t border-border"><Pill tone={h.tone}>{h.label}</Pill></td>
                        <td className="px-3.5 py-3 border-t border-border text-muted">{p.due_date ?? "—"}</td>
                      </tr>
                    );
                  })}
                </Table>
              ) : (
                <Empty title="No projects yet" hint="Create your first project to start tracking delivery." />
              )}
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-4 content-start">
          <Card className="bg-[linear-gradient(160deg,var(--primary-soft),transparent)]">
            <CardHeader title="AI assistant" />
            <CardBody>
              <p className="text-[13px] leading-relaxed mt-0 mb-3 text-muted">
                Ask about your workspace — answers are bounded to what you're permitted to see.
              </p>
              <AskAi />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Recent activity" />
            <CardBody>
              {activity.length ? (
                <ul className="m-0 p-0 flex flex-col">
                  {activity.map((a) => (
                    <li key={a.id} className="flex gap-3 py-2.5 border-t border-border first:border-0">
                      <div className="w-[30px] h-[30px] rounded-lg bg-card2 grid place-items-center text-muted flex-none">
                        <Icon name="CircleCheck" className="w-[15px] h-[15px]" />
                      </div>
                      <div className="text-[13px]">
                        <b className="font-semibold">{a.action}</b>
                        <span className="text-faint text-[11.5px] block mt-0.5">
                          {a.object_type ?? ""} · {timeAgo(a.created_at)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty title="No activity yet" hint="Actions across the workspace will appear here." />
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
