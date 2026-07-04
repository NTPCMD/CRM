import Link from "next/link";
import { listProjects } from "@/lib/queries";
import { Card, CardBody, PageHeader, Pill, Empty, Button } from "@/components/ui";
import { Icon } from "@/components/icon";
import { healthPill } from "@/lib/health";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listProjects();
  return (
    <>
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} ${projects.length === 1 ? "project" : "projects"}`}
        actions={<Button variant="primary"><Icon name="Plus" className="w-4 h-4" /> New project</Button>}
      />
      {projects.length ? (
        <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
          {projects.map((p) => {
            const h = healthPill(p.health_score);
            const prog = Math.max(0, Math.min(100, p.health_score ?? 0));
            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="hover:border-borderStrong transition-colors">
                  <CardBody>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{p.name}</div>
                        <div className="text-[11.5px] text-faint capitalize">{p.status.replace("_", " ")}</div>
                      </div>
                      <Pill tone={h.tone}>{h.label}</Pill>
                    </div>
                    <div className="h-1.5 rounded-full bg-card2 overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${prog}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted mt-2.5">
                      <span>{prog}% complete</span>
                      <span>Due {p.due_date ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted mt-2.5">
                      <span>Budget {money(p.budget)}</span>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card><CardBody><Empty title="No projects yet" hint="Create a project to organize tasks, files, and delivery." /></CardBody></Card>
      )}
    </>
  );
}
