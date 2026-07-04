import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, listTasks } from "@/lib/queries";
import { Card, CardBody, Pill, Kpi, Empty, Button, Avatar } from "@/components/ui";
import { Icon } from "@/components/icon";
import { healthPill } from "@/lib/health";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

const COLUMNS = [
  { key: "todo", label: "To Do", color: "#9ca3af" },
  { key: "in_progress", label: "In Progress", color: "#3b82f6" },
  { key: "in_review", label: "In Review", color: "#f59e0b" },
  { key: "done", label: "Done", color: "#22c55e" },
];
const PR: Record<string, "red" | "amber" | "grey"> = { urgent: "red", high: "red", medium: "amber", low: "grey" };

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  const tasks = (await listTasks(id)) as Array<{ id: string; title: string; status: string; priority: string; assignee_id: string | null }>;
  const h = healthPill(project.health_score);
  const prog = Math.max(0, Math.min(100, project.health_score ?? 0));

  return (
    <>
      <Link href="/projects" className="text-xs text-muted inline-flex gap-1.5 items-center mb-3.5 hover:text-text">
        <Icon name="ArrowLeft" className="w-3.5 h-3.5" /> All projects
      </Link>
      <div className="flex items-center gap-3.5 mb-5 flex-wrap">
        <div>
          <h1 className="text-[22px] m-0 tracking-tight">{project.name}</h1>
          <div className="text-muted text-[13px] mt-0.5 flex gap-3 items-center flex-wrap">
            <Pill tone={h.tone}>{h.label}</Pill>
            <span>Due {project.due_date ?? "—"}</span>
          </div>
        </div>
        <div className="flex-1" />
        <Button variant="primary"><Icon name="Plus" className="w-4 h-4" /> New task</Button>
      </div>

      <div className="grid gap-3.5 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
        <Kpi label="Progress" value={`${prog}%`} />
        <Kpi label="Budget" value={money(project.budget)} />
        <Kpi label="Tasks" value={tasks.length} />
        <Kpi label="Status" value={<span className="capitalize text-lg">{project.status.replace("_", " ")}</span>} />
      </div>

      {tasks.length ? (
        <div className="grid gap-3.5 overflow-x-auto" style={{ gridAutoFlow: "column", gridAutoColumns: "minmax(230px,1fr)" }}>
          {COLUMNS.map((col) => {
            const items = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="bg-surface border border-border rounded min-w-[230px]">
                <div className="flex items-center gap-2 px-3.5 py-3 text-[12.5px] font-semibold">
                  <span className="w-2 h-2 rounded-[3px]" style={{ background: col.color }} />
                  {col.label}
                  <span className="ml-auto text-faint text-[11px]">{items.length}</span>
                </div>
                <div className="px-2.5 pb-2.5 flex flex-col gap-2.5 min-h-[40px]">
                  {items.map((t) => (
                    <div key={t.id} className="bg-card border border-border rounded-[10px] p-3 shadow-card">
                      <div className="text-[13px] font-semibold mb-2 leading-snug">{t.title}</div>
                      <div className="flex items-center gap-2 text-faint text-[11px]">
                        <Pill tone={PR[t.priority] ?? "grey"}>{t.priority}</Pill>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card><CardBody><Empty title="No tasks yet" hint="Break this project into tasks to start tracking work." /></CardBody></Card>
      )}
    </>
  );
}
