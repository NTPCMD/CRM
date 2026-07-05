import Link from "next/link";
import { listAllTasks } from "@/lib/more-queries";
import { PageHeader, Pill, Card, CardBody, Empty } from "@/components/ui";

export const dynamic = "force-dynamic";

const COLUMNS = [
  { key: "todo", label: "To Do", color: "#9ca3af" },
  { key: "in_progress", label: "In Progress", color: "#3b82f6" },
  { key: "in_review", label: "In Review", color: "#f59e0b" },
  { key: "done", label: "Done", color: "#22c55e" },
];
const PR: Record<string, "red" | "amber" | "grey"> = { urgent: "red", high: "red", medium: "amber", low: "grey" };

export default async function TasksPage() {
  const tasks = await listAllTasks();
  return (
    <>
      <PageHeader title="Tasks" subtitle={`${tasks.length} tasks across your projects`} />
      {tasks.length ? (
        <div className="grid gap-3.5 overflow-x-auto" style={{ gridAutoFlow: "column", gridAutoColumns: "minmax(240px,1fr)" }}>
          {COLUMNS.map((col) => {
            const items = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="bg-surface border border-border rounded min-w-[240px]">
                <div className="flex items-center gap-2 px-3.5 py-3 text-[12.5px] font-semibold">
                  <span className="w-2 h-2 rounded-[3px]" style={{ background: col.color }} />
                  {col.label}
                  <span className="ml-auto text-faint text-[11px]">{items.length}</span>
                </div>
                <div className="px-2.5 pb-2.5 flex flex-col gap-2.5 min-h-[40px]">
                  {items.map((t) => (
                    <Link key={t.id} href={`/projects/${t.project_id}`}
                      className="bg-card border border-border rounded-[10px] p-3 shadow-card hover:border-borderStrong block">
                      <div className="text-[13px] font-semibold mb-2 leading-snug">{t.title}</div>
                      <div className="flex items-center gap-2 text-faint text-[11px]">
                        <Pill tone={PR[t.priority] ?? "grey"}>{t.priority}</Pill>
                        <span className="ml-auto truncate">{t.projects?.name ?? ""}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card><CardBody><Empty title="No tasks yet" hint="Open a project and add tasks to see them here." /></CardBody></Card>
      )}
    </>
  );
}
